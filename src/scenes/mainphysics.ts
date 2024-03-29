import AbstractSprite from '../abstracts/abstractsprite';
import PhysicsContext from '../contexts/physicscontext';
import RenderContext from '../contexts/rendercontext';
import Entity from '../entities/entity';
import Attack from '../entities/equipment/attack';
import ExpDrop from '../entities/expdrop';
import CallbackBinding from '../utils/callbackbinding';
import Vector from '../utils/vector';
import Main from './main';

export default class MainPhysics {
    public get world(): Phaser.Physics.Matter.World {
        return this.physics_context.matter.world;
    }

    constructor(readonly scene: Main, readonly render_context: RenderContext, readonly physics_context: PhysicsContext) {

    }

    public ready_player(player: Entity): void {
        const body_dimensions: Vector = new Vector(80, 100);
        body_dimensions.multiply(this.render_context.base_scale_factor);

        player.physics_body.setBody({
            type: 'rectangle',
            width: body_dimensions.x,
            height: body_dimensions.y
        });
        player.physics_body.setFixedRotation();
        player.physics_body.setFriction(0.4, 0.1);
        player.physics_body.setCollisionCategory(this.physics_context.collision_player);
        player.physics_body.setCollidesWith(this.physics_context.collision_drop);
    }

    public ready_enemy(enemy: Entity): void {
        const body_dimensions: Vector = new Vector(60, 80);
        body_dimensions.multiply(this.render_context.base_scale_factor);

        enemy.physics_body.setName(enemy.key);
        enemy.physics_body.setBody({
            type: 'rectangle',
            width: body_dimensions.x,
            height: body_dimensions.y
        });
        enemy.physics_body.setFixedRotation();
        // enemy.physics_body.setStatic(true);
        enemy.physics_body.setBounce(0.8);
        enemy.physics_body.setFriction(0.4, 0.2);
        enemy.physics_body.setCollisionCategory(this.physics_context.collision_enemy);
        enemy.physics_body.setCollidesWith(this.physics_context.collision_attack);
    }

    public ready_dagger(player: Entity, dagger: Attack): void {
        dagger.physics_body.setFriction(0.1, 0.01);
        dagger.physics_body.setVelocity(0);
        dagger.physics_body.setAngularVelocity(0);
        dagger.physics_body.setName(dagger.sprite.uid);
        dagger.physics_body.setCollisionCategory(this.physics_context.collision_attack);
        dagger.physics_body.setCollidesWith(this.physics_context.collision_enemy);

        dagger.constraint = this.render_context.scene.matter.add.constraint((player.physics_body as any), (dagger.physics_body as any));

        dagger.physics_body.setOnCollide((collision: any) => {
            if (!this.validate_collision(player, dagger, collision)) return;

            dagger.physics_body.setVelocity(0);
            dagger.physics_body.setAngularVelocity(0);
            dagger.physics_body.setFriction(0.4, 0.1);

            this.world.removeConstraint(dagger.constraint);
            this.deactivate_body(dagger.sprite);
            this.collide_enemy(player, dagger, collision);

            dagger.attack_info.latch = false;
        });
    }

    public ready_fan(player: Entity, fan: Attack): void {
        fan.physics_body.setVelocity(0);
        fan.physics_body.setAngularVelocity(1);
        fan.physics_body.setFriction(0.4, 0.1);
        fan.physics_body.setName(fan.sprite.uid);
        fan.physics_body.setCollisionCategory(this.physics_context.collision_attack);
        fan.physics_body.setCollidesWith(this.physics_context.collision_enemy);

        fan.physics_body.setOnCollide((collision: any) => {
            if (!this.validate_collision(player, fan, collision)) return;

            fan.physics_body.setFriction(0.4, 0.1);
            this.collide_enemy(player, fan, collision);
        });
    }

    public ready_cleave(player: Entity, cleave: Attack): void {
        cleave.physics_body.setVelocity(0);
        cleave.physics_body.setFriction(0.4, 0.1);
        cleave.physics_body.setName(cleave.sprite.uid);
        cleave.physics_body.setCollisionCategory(this.physics_context.collision_attack);
        cleave.physics_body.setCollidesWith(this.physics_context.collision_enemy);
        cleave.physics_body.setFixedRotation();
        cleave.physics_body.setSensor(true);

        cleave.physics_body.setOnCollide((collision: any) => {
            if (!this.validate_collision(player, cleave, collision)) return;

            cleave.physics_body.setFriction(0.4, 0.1);
            this.collide_enemy(player, cleave, collision);
        });
    }

    public ready_dart(player: Entity, dart: Attack): void {
        dart.physics_body.setVelocity(0);
        dart.physics_body.setAngularVelocity(0);
        dart.physics_body.setFriction(0.4, 0.1);
        dart.physics_body.setName(dart.sprite.uid);
        dart.physics_body.setCollisionCategory(this.physics_context.collision_attack);
        dart.physics_body.setCollidesWith(this.physics_context.collision_enemy);

        dart.physics_body.setOnCollide((collision: any) => {
            if (!this.validate_collision(player, dart, collision)) return;

            dart.physics_body.setVelocity(0);
            dart.physics_body.setAngularVelocity(0);
            this.collide_enemy(player, dart, collision);
        });
    }

    public ready_exp_drop(player: Entity, exp_drop: ExpDrop): void {
        exp_drop.sprite.physics_body.setCollisionCategory(this.physics_context.collision_drop);
        exp_drop.sprite.physics_body.setCollidesWith(this.physics_context.collision_player);
        exp_drop.sprite.physics_body.setSensor(true);

        exp_drop.sprite.physics_body.setOnCollideWith(player.physics_body, () => {
            if (exp_drop.collected) return;

            this.collect_exp_drop(exp_drop);
        });
    }

    public collect_exp_drop(exp_drop: ExpDrop): void {
        exp_drop.collected = true;
        this.render_context.untween(exp_drop.sprite.framework_object);
    }

    public ready_treasure(player: Entity, treasure: AbstractSprite, on_collide: CallbackBinding): void {
        treasure.physics_body.setCollisionCategory(this.physics_context.collision_drop);
        treasure.physics_body.setCollidesWith(this.physics_context.collision_player);
        treasure.physics_body.setSensor(true);

        treasure.physics_body.setOnCollideWith(player.physics_body, () => {
            this.deactivate_body(treasure);
            on_collide.call();
        });
    }

    public validate_collision(player: Entity, attack: Attack, collision: any): boolean {
        let enemy: Entity = this.scene.enemies.find(enemy => enemy.key === collision.bodyA.gameObject.name);
        if (!enemy) enemy = this.scene.enemies.find(enemy => enemy.key === collision.bodyB.gameObject.name);
        if (!enemy) return false;

        if (enemy.confirm_hit(attack.uid, attack.attack_info.latch ? attack.attack_info.equipment_key : '')) {
            collision.isActive = false;
            return false;
        }

        return true;
    }

    public collide_enemy(player: Entity, attack: Attack, collision: any): boolean {
        let enemy: Entity = this.scene.enemies.find(enemy => enemy.key === collision.bodyA.gameObject.name);
        if (!enemy) enemy = this.scene.enemies.find(enemy => enemy.key === collision.bodyB.gameObject.name);
        if (!enemy) return false;

        return this.scene.collide(attack, enemy, collision);
    }

    public apply_force(sprite: AbstractSprite, direction: Vector, intensity: number = 1): void {
        const scaled_direction: Vector = direction.normalize().multiply(intensity);
        sprite.physics_body.applyForce(scaled_direction.pv2);
    }

    public reactivate_body(sprite: AbstractSprite): void {
        this.physics_context.matter.world.add(sprite.physics_body.body);
    }

    public deactivate_body(sprite: AbstractSprite): void {
        this.physics_context.matter.world.remove(sprite.physics_body.body);
    }
}