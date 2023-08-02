const css: any = require('../assets/styles/style.css');
import AbstractGame from './abstracts/abstractgame';

{
    const dpr: number = window.devicePixelRatio;

    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.WEBGL,
        disableContextMenu: true,
        render: {
            pixelArt: true,
            transparent: false
        },
        scale: {
            mode: Phaser.Scale.RESIZE,
            width: '100%',
            height: '100%'
        },
        physics: {
            default: 'matter',
            matter: {
                enableSleeping: true
                // debug: {
                //     showBounds: true,
                //     showVelocity: true
                // }
            }
        }
    };

    new AbstractGame(config);
}