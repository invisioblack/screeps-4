module.exports = {
	Init: function() {
		let command_list = new Array();

		command_list.push("profiler.run(cycles)");
		command_list.push("profiler.stop()");
		
		
		command_list.push("");
		command_list.push("allies.add(ally)");
		
		allies = new Object()
		allies.add = function(ally) {
			if (_.get(Memory, ["hive", "allies"]) == null) _.set(Memory["hive", "allies"], []);
			Memory["hive"]["allies"].push(ally);
			return `<font color=\"#D3FFA3\">[Console]</font> Player ${ally} added to ally list.`
		};

		command_list.push("allies.add_list([ally1, ally2, ...])");

		allies.add_list = function(allyList) {
			Array.prototype.push.apply(Memory["hive"]["allies"], allyList);
			return `<font color=\"#D3FFA3\">[Console]</font> Players added to ally list.`
		};

		command_list.push("allies.remove(ally)");
		
		allies.remove = function(ally) {
			let index = _.get(Memory, ["hive", "allies"]).indexOf(ally);
			if (index >= 0) {
				Memory["hive"]["allies"].splice(index, 1);
				return `<font color=\"#D3FFA3\">[Console]</font> Player ${ally} removed from ally list.`
			} else {
				return `<font color=\"#D3FFA3\">[Console]</font> Error: Player ${ally} not found in ally list.`
			}
		};

		command_list.push("allies.clear()");
		allies.clear = function() {
			_.set(Memory, ["hive", "allies"], []);
			return `<font color=\"#D3FFA3\">[Console]</font> Ally list cleared.`
		};


		blueprint = new Object();
		command_list.push("");

		command_list.push("blueprint.set_layout(rmName, originX, originY, layoutName)");

		blueprint.set_layout = function(rmName, originX, originY, layoutName) {
			_.set(Memory, ["rooms", rmName, "layout"], { origin: {x: originX, y: originY}, name: layoutName });
			return `<font color=\"#D3FFA3\">[Console]</font> Blueprint layout set for ${rmName}.`;
		};

		command_list.push("blueprint.block_area(rmName, startX, startY, endX, endY)");

		blueprint.block_area = function(rmName, startX, startY, endX, endY) {
			if (_.get(Memory, ["rooms", rmName, "layout", "blocked_areas"]) == null)
				Memory["rooms"][rmName]["layout"]["blocked_areas"] = [];
			Memory["rooms"][rmName]["layout"]["blocked_areas"].push({start: {x: startX, y: startY}, end: {x: endX, y: endY}});
			return `<font color=\"#D3FFA3\">[Console]</font> Blueprint area blocked for ${rmName} from (${startX}, ${startY}) to (${endX}, ${endY}).`;
		};


		command_list.push("blueprint.request(rmName)");

		blueprint.request = function(rmName) {
			_.set(Memory, ["hive", "pulses", "blueprint", "request"], rmName);
			return `<font color=\"#D3FFA3\">[Console]</font> Setting Blueprint() request for ${rmName}; Blueprint() will run this request next tick.`;
		};

		command_list.push("blueprint.reset()");
		blueprint.reset = function() {
			delete Memory["hive", "pulses"]["blueprint"];
			return `<font color=\"#D3FFA3\">[Console]</font> Resetting Blueprint() cycles; Blueprint() will initiate next tick.`;
		};

		command_list.push("blueprint.redefine_links()");
		blueprint.redefine_links = function() {
			_.each(_.filter(Game.rooms, r => { return (r.controller != null && r.controller.my); }), r => {
				if (_.has(Memory, ["rooms", r.name, "links"]))
					delete Memory["rooms"][r.name]["links"];
			});

			_.set(Memory, ["hive", "pulses", "reset_links"], true);
			return `<font color=\"#D3FFA3\">[Console]</font> Resetting all link definitions; will redefine next tick.`;
		};

		
		log = new Object();
		log.all = function() {
			this.nukers();
			this.labs();
			this.controllers();
			this.resources();
			return `<font color=\"#D3FFA3\">[Console]</font> Main logs printed.`;
		}

		command_list.push("");
		command_list.push("log.can_build()");
		
		log.can_build = function() {
			let rooms = _.filter(Game.rooms, n => { return n.controller != null && n.controller.my; });
			console.log("<font color=\"#D3FFA3\">[Console]</font> Buildable structures:");
			for (let r in rooms) {
				room = rooms[r];

				let output = `${room.name}: `;
				for (let s in CONTROLLER_STRUCTURES) {
					if (s == "road" || s == "constructedWall" || s == "rampart")
						continue;

					let amount = CONTROLLER_STRUCTURES[s][room.controller.level]
						- room.find(FIND_STRUCTURES, { filter: t => { return t.structureType == s; }}).length;
					output += amount < 1 ? "" : `${amount} x ${s};  `;
				}
				console.log(output);
			}
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};

		command_list.push("log.controllers()");
		
		log.controllers = function() {
			console.log("<font color=\"#D3FFA3\">[Console]</font> Room Controllers:");
			let output = "<table>"
			_.each(_.sortBy(_.sortBy(_.filter(Game.rooms, 
					r => { return r.controller != null && r.controller.my; }), 
					r => { return -r.controller.progress; }), 
					r => { return -r.controller.level; }), r => {
				output += `<tr><td><font color=\"#D3FFA3\">${r.name}:</font>  (${r.controller.level})  </td> `
					+ `<td>${r.controller.progress}  </td><td>  /  </td><td>${r.controller.progressTotal}    </td> `
					+ `<td>(${(r.controller.progress / r.controller.progressTotal * 100).toFixed()} %)</td></tr>`;
			});
			console.log(`${output}</table>`);
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};

		command_list.push("log.labs()");

		log.labs = function() {
			let output = "<font color=\"#D3FFA3\">[Console]</font> Lab Report<br>"
				+ "<table><tr><th>Room \t</th><th>Mineral \t</th><th>Amount \t</th><th>Target Amount \t</th><th>Reagent #1 \t</th><th>Reagent #2</th></tr>";
			
			_.each(_.keys(_.get(Memory, ["resources", "labs", "reactions"])), r => {
				let rxn = Memory["resources"]["labs"]["reactions"][r];
				
				let amount = 0;
				_.each(_.filter(Game.rooms, 
					r => { return r.controller != null && r.controller.my && (r.storage || r.terminal); }), 
					r => { amount += r.store(_.get(rxn, "mineral")); });
				
				let reagents = "";
				_.each(getReagents(_.get(rxn, "mineral")), 
					reagent => { 
					
					let r_amount = 0;
					_.each(_.filter(Game.rooms, 
						r => { return r.controller != null && r.controller.my && (r.storage || r.terminal); }), 
						r => { r_amount += r.store(reagent); });					
					reagents += `<td>${reagent}: \t${r_amount}</td>` ;
				});
				
				output += `<tr><td>${r}</td><td>${_.get(rxn, "mineral")}</td><td>${amount}</td><td>(${_.get(rxn, "amount")})${reagents}</tr>`
			});
			
			console.log(`${output}</table>`);
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};
		
		command_list.push("log.resources()");
		
		log.resources = function(resource = null, limit = 1) {
			let resource_list = resource != null ? [ resource ] : RESOURCES_ALL;
			let room_list = _.filter(Game.rooms, r => { return r.controller != null && r.controller.my && (r.storage || r.terminal); });
			
			let output = `<font color=\"#FFF"><tr><th>Resource\t</th><th>Total \t\t</th>`;
			_.each(room_list, r => { output += `<th><font color=\"#${r.terminal ? "5DB65B" : "B65B5B"}\">${r.name}</font> \t</th>`; });
			
			_.each(resource_list, res => {				
				let amount = 0;
				let output_rooms = "";
				
				_.each(room_list, r => {
					let a = r.store(res);
					amount += a;
					output_rooms += `<td>${a}</td>`
				});

				if (amount >= limit)
					output += `<tr><td>${res}</td><td>${amount}</td> ${output_rooms} </tr>`;									
			});
			
			console.log(`<font color=\"#D3FFA3">log.resources</font> <table>${output}</table>`);
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};

		command_list.push("log.remote_mining()");
		
		log.remote_mining = function() {
			let output = "";
			let remote = _.get(Memory, ["sites", "remote_mining"]);
		
			_.each(_.filter(Game.rooms, r => { return r.controller != null && r.controller.my; }), r => {
				output += `<tr><td>${r.name}</td><td>  ->  </td>`;
				_.each(_.filter(Object.keys(remote), rem => { return _.get(remote[rem], "colony") == r.name; }), rem => { output += `<td>  ${rem}  </td>`; });
				output += `</tr>`;
			});

			console.log(`<font color=\"#D3FFA3">log.mining</font><table>${output}</table>`);
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};

		command_list.push("log.storage()");

		log.storage = function() {
			console.log(`<font color=\"#D3FFA3">log-storage</font>`);

			for (let i = 0; i < Object.keys(Game.rooms).length; i++) {
				let room = Game.rooms[Object.keys(Game.rooms)[i]];
				if (room.storage != null) {
					if (_.sum(room.storage) == 0) {
						console.log(`${room.name} storage: empty`);
					} else {
						let output = `<font color=\"#D3FFA3\">${room.name}</font> storage (${parseInt(_.sum(room.storage.store) / room.storage.storeCapacity * 100)}%): `;
						for (let res in room.storage.store) {
							if (room.storage.store[res] > 0)
								output += `<font color=\"#D3FFA3\">${res}</font>: ${_.floor(room.storage.store[res] / 1000)}k;  `;
						}
						console.log(output);
					}
				}

				if (room.terminal != null) {
					if (_.sum(room.terminal) == 0) {
						console.log(`${room.name} terminal: empty`);
					} else {
						let output = `<font color=\"#D3FFA3\">${room.name}</font> terminal (${parseInt(_.sum(room.terminal.store) / room.terminal.storeCapacity * 100)}%): `;
						for (let res in room.terminal.store) {
							if (room.terminal.store[res] > 0)
								output += `<font color=\"#D3FFA3\">${res}</font>: ${_.floor(room.terminal.store[res] / 1000)}k;  `;
						}
						console.log(output);
					}
				}
			}
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};

		command_list.push("log.nukers()");

		log.nukers = function() {
			console.log("<font color=\"#D3FFA3\">[Console]</font> Nukers:");
			_.each(_.filter(Game.rooms, r => { return r.controller != null && r.controller.my; }), r => {
				let nuker = _.head(r.find(FIND_STRUCTURES, { filter: (s) => { return s.structureType == "nuker"; } }));
				if (nuker != null) {
					console.log(`<font color=\"#D3FFA3\">${r.name}:</font> `
						+ `<font color=\"#${nuker.cooldown == 0 ? "47FF3E" : "FF3E3E"}\">`
							+ `cooldown: ${nuker.cooldown};</font>  `
						+ `<font color=\"#${nuker.energy == nuker.energyCapacity ? "47FF3E" : "FF3E3E"}\">`
							+ `energy: ${nuker.energy} (${parseFloat(nuker.energy / nuker.energyCapacity * 100).toFixed(0)}%);</font>  `
						+ `<font color=\"#${nuker.ghodium == nuker.ghodiumCapacity ? "47FF3E" : "FF3E3E"}\">`
							+ `ghodium: ${nuker.ghodium} (${parseFloat(nuker.ghodium / nuker.ghodiumCapacity * 100).toFixed(0)}%)</font>`);
				}
			});
			return "<font color=\"#D3FFA3\">[Console]</font> Report generated";
		};


		command_list.push("");
		command_list.push("labs.set_reaction(mineral, amount, priority)");

		labs = new Object();
		labs.set_reaction = function(mineral, amount, priority) {
			_.set(Memory, ["resources", "labs", "targets", mineral], { mineral: mineral, amount: amount, priority: priority });
			return `<font color=\"#D3FFA3\">[Console]</font> ${mineral} reaction target set to ${amount} (priority ${priority}).`;
		};

		command_list.push("labs.set_boost(labID, mineral, role, subrole)");	
	
		labs.set_boost = function(labID, mineral, role, subrole) {
			let lab = Game.getObjectById(labID);
			let rmName = lab.pos.roomName;
			let labDefinitions = _.get(Memory, ["rooms", rmName, "lab_definitions"]);
			if (lab == null) return;

			if (labDefinitions == null)
				labDefinitions = [];

			labDefinitions.push(
				{ action: "boost", mineral: mineral, lab: labID, role: role, subrole: subrole });
				
			_.set(Memory, ["rooms", rmName, "lab_definitions"], labDefinitions);
			delete Memory["hive"]["pulses"]["lab"];	
			return `<font color=\"#D3FFA3\">[Console]</font> Boost added for ${mineral} to ${role}, ${subrole} from ${labID}`;
		};

		command_list.push("labs.clear_reactions()");
		
		labs.clear_reactions = function() {
			_.set(Memory, ["resources", "labs", "targets"], new Object());	
			delete Memory["hive"]["pulses"]["lab"];			
			return `<font color=\"#D3FFA3\">[Console]</font> All lab mineral targets cleared.`;
		};

		command_list.push("labs.clear_boosts(rmName)");	
		
		labs.clear_boosts = function(rmName) {
			delete Memory["rooms"][rmName]["lab_definitions"];
			delete Memory["hive"]["pulses"]["lab"];	
			return `<font color=\"#D3FFA3\">[Console]</font> All boosts cleared for ${rmName}`;
		};

		command_list.push("labs.renew_assignments()");
		
		labs.renew_assignments = function() {
			delete Memory["hive"]["pulses"]["lab"];			
			return `<font color=\"#D3FFA3\">[Console]</font> Labs will renew definitions and reaction assignments next tick.`;
		};
		

		command_list.push("");
		command_list.push("resources.overflow_cap(capAmount)");

		resources = new Object();
		resources.overflow_cap = function(amount) {
			_.set(Memory, ["resources", "to_overflow"], amount);
			return `<font color=\"#D3FFA3\">[Console]</font> Energy overflow cap set to ${amount}.`;
		};

		command_list.push("resources.market_cap(resource, capAmount)");

		resources.market_cap = function(resource, amount) {
			_.set(Memory, ["resources", "to_market", resource], amount);
			return `<font color=\"#D3FFA3\">[Console]</font> ${resource} market overflow set to ${amount}.`;
		};		

		command_list.push("resources.send(orderName, rmFrom, rmTo, resource, amount)");

		resources.send = function(orderName, rmFrom, rmTo, resource, amount) {
			_.set(Memory, ["resources", "terminal_orders", orderName], { room: rmTo, from: rmFrom, resource: resource, amount: amount, priority: 1});
			return `<font color=\"#D3FFA3\">[Console]</font> Order set at Memory["resources"]["terminal_orders"][${orderName}]; delete from Memory to cancel.`;
		};

		command_list.push("resources.market_sell(orderName, marketOrderID, rmFrom, amount)");

		resources.market_sell = function(orderName, marketOrderID, rmFrom, amount) {
			_.set(Memory, ["resources", "terminal_orders", orderName], { market_id: marketOrderID, amount: amount, from: rmFrom, priority: 4});
			return `<font color=\"#D3FFA3\">[Console]</font> Order set at Memory["resources"]["terminal_orders"][${orderName}]; delete from Memory to cancel.`;
		};

		command_list.push("resources.market_buy(orderName, marketOrderID, rmTo, amount)");

		resources.market_buy = function(orderName, marketOrderID, rmTo, amount) {
			_.set(Memory, ["resources", "terminal_orders", orderName], { market_id: marketOrderID, amount: amount, to: rmTo, priority: 4});
			return `<font color=\"#D3FFA3\">[Console]</font> Order set at Memory["resources", "terminal_orders"][${orderName}]; delete from Memory to cancel.`;
		};

		command_list.push("resources.clear_market_cap()");
		
		resources.clear_market_cap = function() {
			_.set(Memory, ["resources", "to_market"], new Object());			
			return `<font color=\"#D3FFA3\">[Console]</font> Market overflow limits deleted; existing transactions can be deleted with resources.clear_transactions().`;
		};

		command_list.push("resources.clear_transactions()");
		
		resources.clear_transactions = function() {
			_.set(Memory, ["resources", "terminal_orders"], new Object());
			return `<font color=\"#D3FFA3\">[Console]</font> All terminal transactions cleared.`;
		};

		
		command_list.push("");
		command_list.push("colonize(rmFrom, rmTarget, {origin: {x: baseX, y: baseY}, name: layoutName}, [listRoute])");

		colonize = function(rmFrom, rmTarget, layout, listRoute) {
			_.set(Memory, ["sites", "colonization", rmTarget], { from: rmFrom, target: rmTarget, layout: layout, listRoute: listRoute });
			return `<font color=\"#D3FFA3\">[Console]</font> Colonization request added to Memory.sites.colonization.${rmTarget} ... to cancel, delete the entry.`;
		};

		command_list.push("invade(rmFrom, rmInvade, toOccupy, listSpawnRooms, listArmy, listTargets, posRally, listRoute)");

		invade = function(rmColony, rmInvade, toOccupy, listSpawnRooms, listArmy, listTargets, posRally, listRoute) {
			_.set(Memory, ["sites", "invasion", rmInvade], { from: rmColony, target: rmInvade, occupy: toOccupy, 
				spawn_assist: listSpawnRooms, army: listArmy, targets: listTargets, rally_point: posRally, route: listRoute });
			return `<font color=\"#D3FFA3\">[Console]</font> Invasion request added to Memory.sites.invasion.${rmInvade} ... to cancel, delete the entry.`;
		};

		command_list.push("occupy(rmFrom, rmOccupy, listSpawnRooms, listArmy, listTargets, listRoute)");

		occupy = function(rmColony, rmOccupy, listSpawnRooms, listArmy, listTargets, listRoute) {
			_.set(Memory, ["sites", "occupation", rmOccupy], { from: rmColony, target: rmOccupy,
				spawn_assist: listSpawnRooms, army: listArmy, targets: listTargets, route: listRoute });
			return `<font color=\"#D3FFA3\">[Console]</font> Occupation request added to Memory.sites.invasion.${rmOccupy} ... to cancel, delete the entry.`;
		};
		
		command_list.push("");
		command_list.push("spawn_assist(rmToAssist, [listRooms], [listRoute])");
		spawn_assist = function(rmToAssist, listRooms, listRoute) {
			_.set(Memory, ["rooms", rmToAssist, "spawn_assist"], { rooms: listRooms, route: listRoute });
			return `<font color=\"#D3FFA3\">[Console]</font> Spawn assist added to Memory.rooms.${rmToAssist}.spawn_assist ... to cancel, delete the entry.`;
		};

		command_list.push("remote_mining(rmColony, rmHarvest, hasKeepers, [listRoute], [listSpawnAssistRooms], [listPopulation])");
		remote_mining = function(rmColony, rmHarvest, hasKeepers, listRoute, listSpawnAssistRooms, listPopulation) {
			if (rmColony == null || rmHarvest == null) 
				return `<font color=\"#D3FFA3\">[Console]</font> Error, invalid entry for remote_mining()`;
			
			_.set(Memory, ["sites", "remote_mining", rmHarvest], { colony: rmColony, has_keepers: hasKeepers, route: listRoute, spawn_assist: listSpawnAssistRooms, population: listPopulation});
			return `<font color=\"#D3FFA3\">[Console]</font> Remote mining added to Memory.sites.remote_mining.${rmHarvest} ... to cancel, delete the entry.`;
		};
		
		command_list.push("");
		command_list.push("create_road(rmName, startX, startY, endX, endY)");

		create_road = function(rmName, startX, startY, endX, endY) {
			let room = Game.rooms[rmName];
			if (room == null)
				return `<font color=\"#D3FFA3\">[Console]</font> Error, ${rmName} not found.`;
			
			let from = new RoomPosition(startX, startY, rmName);
			let to = new RoomPosition(endX, endY, rmName);
			let path = room.findPath(from, to, {ignoreCreeps: true});			
			for (let i = 0; i < path.length; i++)
				room.createConstructionSite(path[i].x, path[i].y, "road");
			room.createConstructionSite(startX, startY, "road");
			room.createConstructionSite(endX, endY, "road");
			
			return `<font color=\"#D3FFA3\">[Console]</font> Construction sites placed in ${rmName} for road from (${startX}, ${startY}) to (${endX}, ${endY}).`;
		};

		command_list.push("set_sign(message, rmName)")

		set_sign = function(message, rmName) {
			/* Sorting algorithm for left -> right, top -> bottom (in SW sector!! Reverse sortBy() for other sectors...
			 * Ensure quote.length == room.length!! Place in main.js
			 			 			
				let quote = [];
				let rooms = _.sortBy(_.sortBy(_.filter(Game.rooms, 
					r => {return r.controller != null && r.controller.my}), 
					r => {return 0 - r.name.substring(1).split("S")[0]}), 
					r => {return r.name.substring(1).split("S")[1]});
				for (let i = 0; i < rooms.length; i++) { 
					set_sign(quote[i], rooms[i].name); 
				}
			*/

			if (rmName != null) {
				_.set(Memory, ["hive", "signs", rmName], message);
				return `<font color=\"#D3FFA3\">[Console]</font> Message for ${rmName} set.`;
			} else {
				_.set(Memory, ["hive", "signs", "default"], message);
				return `<font color=\"#D3FFA3\">[Console]</font> Default message set.`;
			}
		}
		
		command_list.push("");

		commands = function() {
			console.log(`<font color=\"#D3FFA3\">Command list:</font> <br>${command_list.join("<br>")}<br>`);
			return "<font color=\"#D3FFA3\">[Console]</font> Command list complete";
		};
	}
};