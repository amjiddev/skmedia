import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import adminRouter from "./admin";
import authRouter from "./auth";
import promptsRouter from "./prompts";
import teamRouter from "./team";
import aboutContentRouter from "./about-content";
import servicesContentRouter from "./services-content";
import faqRouter from "./faqs";
import homeContentRouter from "./home-content";
import contactContentRouter from "./contact-content";
import communityPlansRouter from "./community-plans";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(adminRouter);
router.use(authRouter);
router.use(promptsRouter);
router.use(teamRouter);
router.use(aboutContentRouter);
router.use(servicesContentRouter);
router.use(faqRouter);
router.use(homeContentRouter);
router.use(contactContentRouter);
router.use(communityPlansRouter);

export default router;
