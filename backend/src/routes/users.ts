import { Router } from "express";
import { addUser } from "../controllers/users/add";
import { getUser, getAllUsers } from "../controllers/users/get"
import { updateUser } from "../controllers/users/update"
import { deleteUser } from "../controllers/users/delete"

export const userRoute = Router()

userRoute.post('/add', addUser)
userRoute.get('/get', getUser)
userRoute.get('/getAllUsers', getAllUsers)
userRoute.patch('/update', updateUser)
userRoute.delete('/delete', deleteUser)