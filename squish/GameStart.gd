extends Control

signal finished()
var internal_master_dict

# Called when the node enters the scene tree for the first time.
func _ready():
	pass

# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta):
	pass

func begin(master_dict):
	internal_master_dict = master_dict

func show():
	$CenterContainer.show()

func hide():
	$CenterContainer.hide()

func end():
	emit_signal("finished", internal_master_dict)

func _on_button_pressed():
	end()
