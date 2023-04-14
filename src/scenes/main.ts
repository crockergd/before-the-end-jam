import AbstractScene from '../abstracts/abstractscene';
import AbstractSprite from '../abstracts/abstractsprite';
import AbstractText from '../abstracts/abstracttext';
import SceneData from '../contexts/scenedata';
import Entity from '../entities/entity';
import EntityFactory from '../entities/entityfactory';
import TransitionType from '../ui/transitiontype';
import { Constants } from '../utils/constants';
import MathExtensions from '../utils/mathextensions';
import StringExtensions from '../utils/stringextensions';
import Vector from '../utils/vector';
import WorldTimer from '../world/worldtimer';
import MainRenderer from './mainrenderer';

export default class Main extends AbstractScene {
    public scene_renderer: MainRenderer;

    public timer: WorldTimer;
    public player: Entity;
    public enemies: Array<Entity>;
    public debug: AbstractText;

    public enemies_defeated: number;

    public init(data: SceneData): void {
        super.init(data);
        this.render_context.set_scene(this);

        this.scene_renderer = new MainRenderer(this.render_context);

        this.matter.world.disableGravity();
        this.enemies_defeated = 0;
        this.enemies = new Array<Entity>();
    }

    public create(): void {
        this.render_context.transition_scene(TransitionType.IN);

        const transition: AbstractSprite = this.render_context.add_sprite(0, 0, 'zone_courtyards_transition');
        transition.set_anchor(0.5, 0.5);

        this.spawn_player();
        this.spawn_enemy();

        this.debug = this.render_context.add_text(this.render_context.space_buffer, this.render_context.space_buffer, '');
        this.debug.affix_ui();

        this.render_context.camera.setBackgroundColor(0x003003);

        this.timer = new WorldTimer(this.render_context.now);
    }

    public update(time: number, dt_ms: number): void {
        super.update(time, dt_ms);
        const dt: number = (dt_ms / 1000);

        this.debug.text = 'Position: ' + Math.floor(this.player.x) + ', ' + Math.floor(this.player.y) + Constants.LINE_BREAK +
            'Enemies Defeated: ' + this.enemies_defeated + Constants.LINE_BREAK +
            'Time Remaining: ' + Math.floor(this.timer.expiry_time) + Constants.LINE_BREAK +
            'Time Elapsed: ' + Math.ceil(this.timer.elapsed_time);

        if (!this.timer.update(dt)) {
            // game over
        }
    }

    public spawn_player(): void {
        this.player = EntityFactory.create_player('bandit');
        this.scene_renderer.draw_player(this.player);

        this.input.on(Constants.UP_EVENT, this.click, this);
    }

    public spawn_enemy(): void {
        const initial_position: Vector = new Vector(Math.floor(this.player.x), Math.floor(this.player.y));
        const distance: number = 300;
        const bounds: Vector = new Vector(initial_position.x - distance, initial_position.y - distance, initial_position.x + distance, initial_position.y + distance);
        const enemy_position: Vector = MathExtensions.rand_within_bounds(bounds);

        const enemy: Entity = EntityFactory.create_enemy(EntityFactory.random_enemy_key(), 3 + this.enemies_defeated);
        this.scene_renderer.draw_enemy(enemy_position.x, enemy_position.y, enemy);

        enemy.physics.setOnCollide((collision: any) => {
            this.collide(this.player, enemy, collision);
        });
    }

    public click(): void {
        const pointer: Phaser.Input.Pointer = this.render_context.scene.input.activePointer;

        const normalized_cursor_direction: Vector = new Vector(pointer.worldX - this.player.x, pointer.worldY - this.player.y);

        if (normalized_cursor_direction.x > 0) {
            this.player.sprite.flip_x(false);
        } else {
            this.player.sprite.flip_x(true);
        }

        this.player.physics.applyForce(normalized_cursor_direction.pv2.normalize());
    }

    public collide(player: Entity, enemy: Entity, collision: any): void {
        this.scene_renderer.flash_combat_text(enemy.x, enemy.y - enemy.sprite.height_half + this.render_context.literal(20), StringExtensions.numeric(player.power));

        if (player.power >= enemy.power) {
            collision.isActive = false;
            this.enemies_defeated++;
            this.matter.world.remove(enemy.physics);
            this.scene_renderer.flash_enemy_death(enemy);

            this.spawn_enemy();
            this.spawn_enemy();

        } else {
            enemy.battle_info.power -= this.player.power;
        }
    }
}