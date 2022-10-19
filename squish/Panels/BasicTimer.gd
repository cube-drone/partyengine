extends Node

signal finished()

@export
var default_timer_length = 5

var internal_master_dict;

# Called when the node enters the scene tree for the first time.
func _ready():
	if get_parent() == get_tree().root:
		print("I'm the main scene.")
		begin({})
	else:
		print("I'm an instance in another scene.")
		hide()

func hide():
	$Control.hide()

func show():
	$Control.show()

func begin(master_dict):
	internal_master_dict = master_dict
	var timer_length_seconds = default_timer_length
	if "timer_length_seconds" in master_dict and master_dict["timer_length_seconds"] != null:
		timer_length_seconds = master_dict["timer_length_seconds"]
		
	$Timer.wait_time = timer_length_seconds
	$Timer.start()

func end():
	$Timer.stop()
	emit_signal("finished", internal_master_dict)

# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta):
	var label = $Control/CenterContainer/VBoxContainer/RichTextLabel
	label.text = str(round(($Timer.time_left / $Timer.wait_time) * 100)) + "%"

func _on_timer_timeout():
	end()
