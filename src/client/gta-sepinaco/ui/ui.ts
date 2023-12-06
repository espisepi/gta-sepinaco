import XYController from '../controllers/XYController'
import GtaSepinaco from '../GtaSepinaco'

export default class UI {
    public menuActive: boolean
    public recentWinnersTable: HTMLTableElement
    public startButton: HTMLButtonElement
    public menuPanel: HTMLDivElement
    public newGameAlert: HTMLDivElement
    public gameClosedAlert: HTMLDivElement

    public xycontrollerLook?: XYController
    public xycontrollerMove?: XYController

    private rendererDomElement: HTMLCanvasElement
    private gtaSepinaco: GtaSepinaco

    private keyMap: { [id: string]: boolean } = {}

    constructor(gtaSepinaco: GtaSepinaco, rendererDomElement: HTMLCanvasElement) {
        this.gtaSepinaco = gtaSepinaco
        this.rendererDomElement = rendererDomElement
        this.menuActive = true
        this.recentWinnersTable = document.getElementById(
            'recentWinnersTable'
        ) as HTMLTableElement
        this.startButton = document.getElementById(
            'startButton'
        ) as HTMLButtonElement
        this.menuPanel = document.getElementById('menuPanel') as HTMLDivElement
        this.newGameAlert = document.getElementById(
            'newGameAlert'
        ) as HTMLDivElement
        this.gameClosedAlert = document.getElementById(
            'gameClosedAlert'
        ) as HTMLDivElement

        this.startButton.addEventListener(
            'click',
            () => {
                if (gtaSepinaco.isMobile) {
                    this.xycontrollerLook = new XYController(
                        document.getElementById(
                            'XYControllerLook'
                        ) as HTMLCanvasElement,
                        this.onXYControllerLook
                    )
                    this.xycontrollerMove = new XYController(
                        document.getElementById(
                            'XYControllerMove'
                        ) as HTMLCanvasElement,
                        this.onXYControllerMove
                    )

                    this.menuPanel.style.display = 'none'
                    this.recentWinnersTable.style.display = 'block'
                    this.menuActive = false
                } else {
                    rendererDomElement.requestPointerLock()
                }
            },
            false
        )

        document.addEventListener('pointerlockchange', this.lockChangeAlert, false)
        ;(
            document.getElementById('screenNameInput') as HTMLInputElement
        ).addEventListener('keyup', (e) => {
            if (e.which === 13) blur()
        })
        ;(
            document.getElementById('screenNameInput') as HTMLInputElement
        ).addEventListener('change', (e) => {
            var letterNumber = /^[0-9a-zA-Z]+$/
            var value = (e.target as HTMLFormElement).value
            if (value.match(letterNumber) && value.length <= 12) {
                gtaSepinaco.socket.emit(
                    'updateScreenName',
                    (e.target as HTMLFormElement).value
                )
            } else {
                alert('Alphanumeric screen names only please. Max length 12')
            }
        })
    }

    public updateScoreBoard = (recentWinners: []) => {
        const rows = this.recentWinnersTable.rows
        var i = rows.length
        while (--i) {
            this.recentWinnersTable.deleteRow(i)
        }

        recentWinners.forEach((w: any) => {
            const row = this.recentWinnersTable.insertRow()
            const cell0 = row.insertCell(0)
            cell0.appendChild(document.createTextNode(w.screenName))
            const cell1 = row.insertCell(1)
            cell1.appendChild(document.createTextNode(w.time))
        })
    }

    public lockChangeAlert = () => {
        if (
            document.pointerLockElement === this.rendererDomElement ||
            (document as any).mozPointerLockElement === this.rendererDomElement
        ) {
            this.rendererDomElement.addEventListener(
                'mousemove',
                this.onDocumentMouseMove,
                false
            )
            this.rendererDomElement.addEventListener(
                'wheel',
                this.onDocumentMouseWheel,
                false
            )
            document.addEventListener('keydown', this.onDocumentKey, false)
            document.addEventListener('keyup', this.onDocumentKey, false)

            this.menuPanel.style.display = 'none'
            this.recentWinnersTable.style.display = 'block'
            this.menuActive = false
        } else {
            this.rendererDomElement.removeEventListener(
                'mousemove',
                this.onDocumentMouseMove,
                false
            )
            this.rendererDomElement.removeEventListener(
                'wheel',
                this.onDocumentMouseWheel,
                false
            )
            document.removeEventListener('keydown', this.onDocumentKey, false)
            document.removeEventListener('keyup', this.onDocumentKey, false)
            this.menuPanel.style.display = 'block'
            this.recentWinnersTable.style.display = 'none'
            this.gameClosedAlert.style.display = 'none'
            this.newGameAlert.style.display = 'none'
            this.menuActive = true
        }
    }

    public onDocumentMouseMove = (e: MouseEvent) => {
        this.gtaSepinaco.cameraRotationXZOffset +=
            e.movementX * this.gtaSepinaco.sensitivity
        this.gtaSepinaco.cameraRotationYOffset +=
            e.movementY * this.gtaSepinaco.sensitivity
        this.gtaSepinaco.cameraRotationYOffset = Math.max(
            Math.min(this.gtaSepinaco.cameraRotationYOffset, 2.5),
            -2.5
        )
        return false
    }

    public onDocumentMouseWheel = (e: WheelEvent) => {
        this.gtaSepinaco.radius -= e.deltaY * 0.005
        this.gtaSepinaco.radius = Math.max(Math.min(this.gtaSepinaco.radius, 20), 2)
        return false
    }

    public onDocumentKey = (e: KeyboardEvent) => {
        this.keyMap[e.code] = e.type === 'keydown'
        const tmpVec = [0, 0]

        if (this.keyMap['KeyW']) {
            tmpVec[0] += Math.cos(this.gtaSepinaco.cameraRotationXZOffset)
            tmpVec[1] -= Math.sin(this.gtaSepinaco.cameraRotationXZOffset)
        }
        if (this.keyMap['KeyS']) {
            tmpVec[0] -= Math.cos(this.gtaSepinaco.cameraRotationXZOffset)
            tmpVec[1] += Math.sin(this.gtaSepinaco.cameraRotationXZOffset)
        }
        if (this.keyMap['KeyA']) {
            tmpVec[0] += Math.sin(this.gtaSepinaco.cameraRotationXZOffset)
            tmpVec[1] += Math.cos(this.gtaSepinaco.cameraRotationXZOffset)
        }
        if (this.keyMap['KeyD']) {
            tmpVec[0] -= Math.sin(this.gtaSepinaco.cameraRotationXZOffset)
            tmpVec[1] -= Math.cos(this.gtaSepinaco.cameraRotationXZOffset)
        }
        if (this.keyMap['Space']) {
            //space
            this.gtaSepinaco.spcKey = 1
        } else {
            this.gtaSepinaco.spcKey = 0
        }
        this.gtaSepinaco.vec = [tmpVec[0], tmpVec[1]]
    }

    public onXYControllerLook = (value: vec2) => {
        this.gtaSepinaco.cameraRotationXZOffset -= value.x * 0.1
        this.gtaSepinaco.cameraRotationYOffset += value.y * 0.1
        this.gtaSepinaco.cameraRotationYOffset = Math.max(
            Math.min(this.gtaSepinaco.cameraRotationYOffset, 2.5),
            -2.5
        )
    }

    public onXYControllerMove = (value: vec2) => {
        const tmpVec = [0, 0]
        if (value.y > 0) {
            //w
            tmpVec[0] += Math.cos(this.gtaSepinaco.cameraRotationXZOffset) * 0.75
            tmpVec[1] -= Math.sin(this.gtaSepinaco.cameraRotationXZOffset) * 0.75
        }
        if (value.y < 0) {
            //s
            tmpVec[0] -= Math.cos(this.gtaSepinaco.cameraRotationXZOffset) * 0.75
            tmpVec[1] += Math.sin(this.gtaSepinaco.cameraRotationXZOffset) * 0.75
        }
        if (value.x > 0) {
            //a
            tmpVec[0] += Math.sin(this.gtaSepinaco.cameraRotationXZOffset) * 0.75
            tmpVec[1] += Math.cos(this.gtaSepinaco.cameraRotationXZOffset) * 0.75
        }
        if (value.x < 0) {
            //d
            tmpVec[0] -= Math.sin(this.gtaSepinaco.cameraRotationXZOffset) * 0.75
            tmpVec[1] -= Math.cos(this.gtaSepinaco.cameraRotationXZOffset) * 0.75
        }
        this.gtaSepinaco.vec = [tmpVec[0], tmpVec[1]]
    }
}
