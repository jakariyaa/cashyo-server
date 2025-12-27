import { Router } from "express";

import transactionRoutes from "../modules/transaction/transaction.routes";
import userRoutes from "../modules/user/user.routes";
import walletRoutes from "../modules/wallet/wallet.routes";
import systemRoutes from "../modules/system/system.routes";

const router = Router();


router.use("/api/wallets", walletRoutes);
router.use("/api/transactions", transactionRoutes);
router.use("/api/users", userRoutes);
router.use("/api/system", systemRoutes);

export default router;
