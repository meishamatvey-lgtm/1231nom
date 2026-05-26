extends CharacterBody3D

@export var speed = 10.0
@export var jump_force = 5.0
@export var lane_width = 3.0

var current_lane = 0  # -1: left, 0: center, 1: right
var is_jumping = false
var score = 0
var level = 1
var game_over = false

@onready var score_label = $ScoreLabel

func _ready():
	Input.mouse_mode = Input.MOUSE_MODE_HIDDEN

func _physics_process(delta):
	if game_over:
		return
	
	# Автоматическое движение вперед
	velocity.z = -speed
	
	# Управление полосами
	if Input.is_action_just_pressed("ui_left") and current_lane > -1:
		current_lane -= 1
	elif Input.is_action_just_pressed("ui_right") and current_lane < 1:
		current_lane += 1
	
	# Прыжок
	if Input.is_action_just_pressed("ui_select") and not is_jumping:
		velocity.y = jump_force
		is_jumping = true
	
	# Гравитация
	if not is_on_floor():
		velocity.y -= 20.0 * delta
	else:
		is_jumping = false
	
	# Плавное перемещение между полосами
	var target_x = current_lane * lane_width
	velocity.x = lerp(position.x, target_x, 5.0 * delta)
	
	move_and_slide()
	
	# Обновление счета
	score += int(speed * delta)
	score_label.text = "Score: %d | Level: %d" % [score, level]
	
	# Повышение уровня
	if score > level * 500:
		level += 1
		speed += 1.0

func take_damage():
	game_over = true
	get_parent().show_game_over(score)

func collect_bonus(points):
	score += points
