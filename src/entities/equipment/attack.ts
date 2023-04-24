import AbstractSprite from '../../abstracts/abstractsprite';
import AttackInfo from './attackinfo';

export default class Attack {
    public sprite: AbstractSprite;

    public get physics_body(): Phaser.Physics.Matter.Sprite {
        return this.sprite.physics_body;
    }

    constructor(readonly attack_info: AttackInfo) {

    }

    public destroy(): void {
        this.sprite.destroy();
        this.sprite = null;
    }
}