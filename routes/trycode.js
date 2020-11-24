import express from 'express'
import RoomsService from '../services/rooms.js'
import ModesService from '../services/modes.js'

const router = express.Router()

router.setSelected = (modes, current_room) => {
    for (let i = 0; i < modes.length; i++)
        if (modes[i]._id == current_room.mode)
            modes[i].selected = 'selected'

    return modes
}

router.get('/', async (req, res) => {
    let modes = await ModesService.getAll()

    router.setSelected(modes, {mode: modes[0]._id})

    res.render('index', {
        modes: modes,
        current_room_mode: modes[0],
        creator: true
    })
})
router.get('/:room_id', async (req, res) => {
    let current_room = await RoomsService.getRoom(req.params.room_id)

    if (!current_room)
        return res.render('error', {layout: 'error'})

    if (!current_room.password || req.cookies.user_id === current_room.user_id || req.cookies.password === current_room.password) {
        let modes = await ModesService.getAll()
        let current_room_mode = await ModesService.getMood(current_room.mode)

        if (!current_room.mode)
            current_room.mode = modes[0]

        modes = router.setSelected(modes, current_room)

        return res.render('index', {
            current_room: current_room,
            current_room_mode: current_room_mode,
            modes: modes,
            creator: (req.cookies.user_id == current_room.user_id)? true : false,
        })
    }

    return res.render('password', {layout: 'password'})
})

export default router