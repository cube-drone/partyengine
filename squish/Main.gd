extends Node

var panels
var game_over = false;


func _ready():
	panels = [$GameStart, $BasicTimer]
	
	while true:
		await main()

func main():
	
	for panel in panels:
		panel.hide()
	
	var master_dict = {};
	
	for panel in panels:
		panel.show()
		panel.begin(master_dict)
		await panel.finished
		panel.hide()
		master_dict = panel.internal_master_dict
		if game_over: 
			game_over = false
			break

func trigger_game_over():
	game_over = true
