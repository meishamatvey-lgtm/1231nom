extends Node3D

@export var obstacle_scene: PackedScene
@export var bonus_scene: PackedScene
@export var spawn_interval = 2.0
@export var min_spawn_interval = 0.5

var spawn_timer = 0.0
var game_active = true
var player_node = null

func _ready():
	player_node = get_node_or_null("../Player")

func _physics_process(delta):
	if not game_active:
		return
	
	spawn_timer += delta
	if spawn_timer >= spawn_interval:
		spawn_timer = 0.0
		spawn_obstacle()
		if randf() < 0.7:  # 70% шанс спавна бонуса
			spawn_bonus()
		
		# Уменьшение интервала со временем
		if spawn_interval > min_spawn_interval:
			spawn_interval -= 0.01

func spawn_obstacle():
	if obstacle_scene == null:
		# Создаем простое препятствие программно
		var obstacle = Area3D.new()
		obstacle.name = "Obstacle"
		var collision = CollisionShape3D.new()
		collision.shape = BoxShape3D.new()
		collision.shape.size = Vector3(2, 2, 2)
		obstacle.add_child(collision)
		collision.owner = obstacle
		
		var mesh = MeshInstance3D.new()
		mesh.mesh = BoxMesh.new()
		mesh.mesh.size = Vector3(2, 2, 2)
		obstacle.add_child(mesh)
		mesh.owner = obstacle
		
		var lane = randi() % 3 - 1  # -1, 0, 1
		obstacle.position = Vector3(lane * 3, 1, -60)
		add_child(obstacle)
		obstacle.owner = self
		
		# Добавляем скрипт для обнаружения столкновений
		obstacle.body_entered.connect(_on_obstacle_body_entered)
	else:
		var obstacle = obstacle_scene.instantiate()
		var lane = randi() % 3 - 1
		obstacle.position = Vector3(lane * 3, 1, -60)
		add_child(obstacle)

func spawn_bonus():
	if bonus_scene == null:
		# Создаем простой бонус программно
		var bonus = Area3D.new()
		bonus.name = "Bonus"
		var collision = CollisionShape3D.new()
		collision.shape = SphereShape3D.new()
		collision.shape.radius = 0.5
		bonus.add_child(collision)
		collision.owner = bonus
		
		var mesh = MeshInstance3D.new()
		mesh.mesh = SphereMesh.new()
		mesh.mesh.radius = 0.5
		bonus.add_child(mesh)
		mesh.owner = bonus
		
		var lane = randi() % 3 - 1  # -1, 0, 1
		bonus.position = Vector3(lane * 3, 1, -60)
		add_child(bonus)
		bonus.owner = self
		
		# Добавляем скрипт для сбора бонусов
		bonus.body_entered.connect(_on_bonus_body_entered)
	else:
		var bonus = bonus_scene.instantiate()
		var lane = randi() % 3 - 1
		bonus.position = Vector3(lane * 3, 1, -60)
		add_child(bonus)

func _on_obstacle_body_entered(body):
	if body.has_method("take_damage"):
		body.take_damage()

func _on_bonus_body_entered(body):
	if body.has_method("collect_bonus"):
		body.collect_bonus(50)
		if player_node:
			player_node.score += 50
	queue_free()

func start_game():
	game_active = true
	spawn_interval = 2.0

func stop_game():
	game_active = false

func show_game_over(final_score):
	stop_game()
	var game_over_screen = get_node("GameOverScreen")
	game_over_screen.visible = true
	var restart_button = game_over_screen.get_node("RestartButton")
	var menu_button = game_over_screen.get_node("MenuButton")
	
	restart_button.pressed.connect(_on_restart_pressed)
	menu_button.pressed.connect(_on_menu_pressed)

func _on_restart_pressed():
	get_tree().reload_current_scene()

func _on_menu_pressed():
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
