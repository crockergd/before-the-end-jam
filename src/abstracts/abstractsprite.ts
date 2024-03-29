import { GameObjects } from 'phaser';
import RenderContext from '../contexts/rendercontext';
import CallbackBinding from '../utils/callbackbinding';
import Constants from '../utils/constants';
import AbstractBaseType from './abstractbasetype';
import { AbstractCollectionType } from './abstractcollectiontype';
import AbstractScene from './abstractscene';

import AbstractSpriteConfig from './abstractspriteconfig';
import Vector from '../utils/vector';

export default class AbstractSprite extends AbstractBaseType {
    public framework_object: GameObjects.Sprite;
    public base_scale: Vector;

    get physics_body(): Phaser.Physics.Matter.Sprite {
        return (this.framework_object as Phaser.Physics.Matter.Sprite);
    }

    get width(): number {
        return this.framework_object.displayWidth; // / this.renderer.DPR;
    }

    get height(): number {
        return this.framework_object.displayHeight; // / this.renderer.DPR;
    }

    get width_half(): number {
        return this.width / 2;
    }

    get height_half(): number {
        return this.height / 2;
    }

    get key(): string {
        if (!this.framework_object) return null;
        return this.framework_object.texture.key;
    }

    get frame(): number {
        return +this.framework_object.frame.name;
    }

    get cropped(): boolean {
        return this.framework_object.isCropped;
    }

    constructor(renderer: RenderContext, scene: AbstractScene, x: number, y: number, key: string | any, collection?: AbstractCollectionType, readonly config?: AbstractSpriteConfig) {
        super(renderer, x, y);

        let framework_object: GameObjects.Sprite;
        if (this.config?.physics) {
            framework_object = scene.matter.add.sprite(0, 0, key);
        } else {
            framework_object = scene.add.sprite(0, 0, key);
        }
        this.set_framework_object(framework_object);

        this.set_anchor(0, 0);

        if (this.config?.affixed) {
            this.affix_ui();
        }

        if (collection) {
            collection.add(this);

        } else {
            this.update_position();
        }
    }

    public set_base_scale(x: number, y: number) {
        this.base_scale = new Vector(x, y);
        this.framework_object.setScale(this.base_scale.x, this.base_scale.y);
    }

    public set_scale(x: number, y: number): void {
        this.framework_object.setScale(this.base_scale.x * x, this.base_scale.y * y);
    }

    public set_rotation(degrees: number): void {
        const radians: number = degrees * (Math.PI / 180);
        this.framework_object.setRotation(radians);
    }

    public set_frame(frame: number): void {
        if (frame < 0) {
            frame = (this.framework_object.texture.frameTotal - 1) + frame;
        }

        this.framework_object.setFrame(frame);
    }

    public set_angle(angle: number): void {
        this.framework_object.setAngle(angle);
    }

    public set_fill(color?: number): void {
        if (color || color === 0x000000) {
            this.framework_object.setTintFill(color);
        } else {
            this.framework_object.clearTint();
        }
    }

    public flag_cachable(): void {
        this.framework_object.ignoreDestroy = true;
    }

    public crop(x?: number, y?: number, width?: number, height?: number): void {
        if (!x && !y && !width && !height) {
            this.framework_object.setCrop();
            return;
        }

        // FIREFOX can't handle crops with a value of 0, for web testing
        if (this.renderer.scene.game.device.browser.firefox) {
            if (width === 0) width = 1;
            if (height === 0) height = 1;
        }

        if (x) {
            width -= x;
        }
        this.framework_object.setCrop(x, y, width, height);
    }

    public flip_x(override?: boolean): void {
        if (override || override === false) this.framework_object.flipX = override;
        else this.framework_object.flipX = !this.framework_object.flipX;
    }

    public flip_y(override?: boolean): void {
        if (override || override === false) this.framework_object.flipY = override;
        else this.framework_object.flipY = !this.framework_object.flipY;
    }

    public ui_scaled(): void {
        // this.set_scale(Constants.SPRITE_SCALE / 2, Constants.SPRITE_SCALE / 2);
    }

    public has_event(key: string): boolean {
        if (key === Constants.TAP_EVENT) key = Constants.UP_EVENT;

        return this.framework_object.listenerCount(key) > 0;
    }

    public is_playing(key?: string): boolean {
        if (!this.framework_object) return false;
        if (!key) return this.framework_object.anims.isPlaying;
        if (!this.framework_object.anims.isPlaying) return false;
        if (!this.framework_object.anims.currentAnim) return false;

        return this.framework_object.anims.currentAnim.key === key;
    }

    public hit_flash(duration: number, color: number = 0xffffff): void {
        this.set_fill(color);
        this.renderer.delay(duration, () => {
            this.set_fill();
        }, this);
    }

    public play(key: string, start?: number, reverse?: boolean, on_complete?: CallbackBinding): void {
        if (!this.framework_object) return;

        const config: Phaser.Types.Animations.PlayAnimationConfig = {
            key: key,
            timeScale: this.renderer.anim_scale,
            startFrame: start ?? 0
        };

        if (reverse) {
            this.framework_object.playReverse(config);
        } else {
            this.framework_object.play(config);
        }

        if (on_complete) {
            this.framework_object.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + key, () => {
                on_complete.call();
            }, this);
        }
    }

    public pause(): void {
        if (!this.framework_object) return;

        this.framework_object.anims.currentAnim.pause();
    }

    public resume(): void {
        if (!this.framework_object) return;

        this.framework_object.anims.currentAnim.resume();
    }

    public stop(on?: number): void {
        if (on) {
            const current: Phaser.Animations.Animation = this.framework_object.anims.currentAnim;
            if (!current) {
                this.framework_object.stop();

            } else {
                const frame: Phaser.Animations.AnimationFrame = current.frames[on];
                this.framework_object.stopOnFrame(frame);
            }

        } else {
            this.framework_object.stop();
        }
    }
}