var uCr = require('util.creep');

var RolesWork = {

    Worker: function(creep) {

        if (creep.memory.room != null && creep.room.name != creep.memory.room) {
            uCr.moveToRoom(creep, creep.memory.room);
        }
        else {
            switch (creep.memory.state) {
                default:
                    creep.memory.state = 'need_energy';
                    break;

                case 'need_energy':
                    if (_.sum(creep.carry) == creep.carryCapacity) {
                        creep.memory.state = 'task_needed';
                        break;
                    }     
                    
                    RolesWork.Worker_GetEnergy(creep);
                    break;

                case 'task_needed':
                    RolesWork.Worker_AssignTask(creep);
                    break;

                case 'task_working':
                    if (creep.carry[RESOURCE_ENERGY] == 0) {
                        creep.memory.state = 'need_energy';
                        delete creep.memory.task;
                        break;
                    }
                    
                    RolesWork.Worker_RunTask(creep);
                    break;

            }
        }
    },


    Worker_GetEnergy: function(creep) {
        var _ticksReusePath = 10;

        // Priority #1: get dropped energy
        var source = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY, { filter: function (s) { 
            return s.amount >= creep.carryCapacity / 2 && s.resourceType == RESOURCE_ENERGY; }});
        if (source != null && creep.pickup(source) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source, {reusePath: _ticksReusePath});
            return;
        }

        // Priority #2: get energy from receiving links
        if (Memory['hive']['rooms'][creep.room.name]['links'] != null) {
            var links = _.filter(Memory['hive']['rooms'][creep.room.name]['links'], (obj) => { 
                return obj.id && obj['role'] == 'receive'; });
                
            for (var l = 0; l < links.length; l++) {
                var source = Game.getObjectById(links[l]['id']);
                if (source != null && source.energy > 0
                        && creep.pos.getRangeTo(source) < 8 && creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {reusePath: _ticksReusePath});
                    return;
                } 
            }
        }
        
        // Priority #3: get energy from storage or containers
        var source = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (s) { 
            return (s.structureType == STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0)
                || (s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0); }});
        if (source != null && creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source, {reusePath: _ticksReusePath});
            return;
        } 

        // Priority #4: if able to, mine.
        if (creep.getActiveBodyparts('work') > 0) {
            var source = creep.pos.findClosestByRange(FIND_SOURCES, { filter: function (s) { return s.energy > 0; }});
            if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {reusePath: _ticksReusePath});
                return;
            }
        } 
    },


    Worker_AssignTask: function(creep) {
        
        var structure;
        var uCo = require('util.colony');

        // Priority #1: Upgrade critical downgrade timer
        if (creep.memory.subrole == 'upgrader' 
            || (creep.room.controller != null && creep.room.controller.level > 0 && creep.room.controller.ticksToDowngrade < 3500)) {
            creep.memory.task = {
                type: 'upgrade',
                id: creep.room.controller.id,
                timer: 20 };
            creep.memory.state = 'task_working';
            return;
        }
        // Priority #2: Repair critical structures
        structure = uCo.findByNeed_RepairCritical(creep.room);
        if (structure != null) {
            creep.memory.task = {
                type: 'repair',
                id: structure.id,
                timer: 20 };
            creep.memory.state = 'task_working';
            return;
        }
        // Priority #3: Build
        structure = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if (structure != null) {
            creep.memory.task = {
                type: 'build',
                id: structure.id,
                timer: 30 };
            creep.memory.state = 'task_working';
            return;
        }
        // Priority #4: Maintain (repair) structures
        if (creep.memory.subrole == 'repairer' || creep.memory.role == 'multirole') {
            structure = uCo.findByRange_RepairMaintenance(creep);
            if (structure != null) {
                creep.memory.task = {
                    type: 'repair',
                    id: structure.id,
                    timer: 30 };
                creep.memory.state = 'task_working';
                return;
            }
        }
        // Priority #5: Upgrade controller
        if (creep.room.controller != null && creep.room.controller.level > 0) {
            creep.memory.task = {
                type: 'upgrade',
                id: creep.room.controller.id,
                timer: 60 };
            creep.memory.state = 'task_working';
            return;
        }
    },


    Worker_RunTask: function(creep) {
        var _ticksReusePath = 10;

        if (creep.memory.task == null) {
            delete creep.memory.task;
            creep.memory.state == 'task_needed';
        } 
        else if (creep.memory.task['timer'] != null) {
            // Process the task timer
            creep.memory.task['timer'] = creep.memory.task['timer'] - 1;
            if (creep.memory.task['timer'] <= 0) {
                creep.memory.state = 'task_needed';
            }
        }

        if (creep.memory.task['type'] == 'upgrade') {
            var controller = Game.getObjectById(creep.memory.task['id']);
            var result = creep.upgradeController(controller); 
            if (result == OK) return;
            else if (result == ERR_NOT_IN_RANGE) {
                creep.moveTo(controller, {reusePath: _ticksReusePath});
                return;
            } else {
                creep.memory.state = 'task_needed';
            }
        }
        else if (creep.memory.task['type'] == 'repair') {
            var structure = Game.getObjectById(creep.memory.task['id']);
            var result = creep.repair(structure); 
            if (result == OK && structure.hits != structure.hitsMax) return;
            else if (result == ERR_NOT_IN_RANGE) {
                creep.moveTo(structure, {reusePath: _ticksReusePath});
                return;
            } else {
                creep.memory.state = 'task_needed';
            }
        }
        else if (creep.memory.task['type'] == 'build') {
            var structure = Game.getObjectById(creep.memory.task['id']);
            var result = creep.build(structure);
            if (result == OK) return;
            else if (result == ERR_NOT_IN_RANGE) {
                creep.moveTo(structure, {reusePath: _ticksReusePath});
                return;
            } else {
                creep.memory.state = 'task_needed';
            }
        }
    }
};

module.exports = RolesWork;