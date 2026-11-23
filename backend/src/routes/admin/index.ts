import { Router } from 'express'
import { requireStaff } from '../../middleware/auth'
import { adminCatalogRouter } from './catalog'
import { adminFlagsRouter } from './flags'
import { adminOverviewRouter } from './overview'
import { adminPeopleRouter, adminStudentsRouter } from './people'
import { adminQuestionsRouter } from './questions'

export const adminRouter = Router()
adminRouter.use(requireStaff)
adminRouter.use('/overview', adminOverviewRouter)
adminRouter.use('/', adminCatalogRouter)
adminRouter.use('/questions', adminQuestionsRouter)
adminRouter.use('/flags', adminFlagsRouter)
adminRouter.use('/people', adminPeopleRouter)
adminRouter.use('/students', adminStudentsRouter)
