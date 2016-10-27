Population__Colony_RCL_Low =
	{ worker:   {level: 3, amount: 2},
	  repairer: {level: 3, amount: 1},
	  upgrader: {level: 3, amount: 1} };
Population__Colony_RCL_Mid =
	{ worker:   {level: 7, amount: 1},
	  repairer: {level: 5, amount: 1},
	  upgrader: {level: 7, amount: 2} };
Population__Colony_RCL8 =
	{ worker:   {level: 7, amount: 1, scale_level: false},
	  repairer: {level: 6, amount: 1} };

Population__Mining_RCL_Low =
	{ burrower:  {level: 5, amount: 1},
	  carrier:   {level: 3, amount: 2} };
Population__Mining_1S_Colony =
	{ burrower:  {level: 5, amount: 1},
	  carrier:   {level: 6, amount: 2},
	  extractor: {level: 8, amount: 1} };
Population__Mining_2S_Colony =
	{ burrower:  {level: 6, amount: 1},
	  carrier:   {level: 7, amount: 2},
	  extractor: {level: 8, amount: 1} };
Population__Mining_1S_Remote =
	{ burrower:  {level: 5, amount: 1},
	  carrier:   {level: 7, amount: 2},
	  multirole: {level: 6, amount: 1},
	  reserver:  {level: 6, amount: 1} };
Population__Mining_2S_Remote =
	{ burrower:  {level: 6, amount: 1},
	  carrier:   {level: 7, amount: 3},
	  multirole: {level: 6, amount: 1},
	  reserver:  {level: 6, amount: 1} };
Population__Mining_2S_Remote_AT =
	{ burrower:  {level: 6, amount: 1, body: "burrower_at"},
	  carrier:   {level: 7, amount: 3, body: "carrier_at"},
	  multirole: {level: 6, amount: 1},
	  reserver:  {level: 6, amount: 1, body: "reserver_at"} };

Population__Industry =
	{ courier:   {level: 5, amount: 1} };