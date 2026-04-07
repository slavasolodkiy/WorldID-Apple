import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import walletRouter from "./wallet";
import transactionsRouter from "./transactions";
import verificationRouter from "./verification";
import appsRouter from "./apps";
import contactsRouter from "./contacts";
import notificationsRouter from "./notifications";
import statsRouter from "./stats";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

router.use(requireAuth);

router.use(usersRouter);
router.use(walletRouter);
router.use(transactionsRouter);
router.use(verificationRouter);
router.use(appsRouter);
router.use(contactsRouter);
router.use(notificationsRouter);
router.use(statsRouter);

export default router;
