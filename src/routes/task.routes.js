import { Router } from "express";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  createSubTask,
  updateSubTask,
  deleteSubTask,
} from "../controllers/task.controllers.js";
import {
  verifyJWT,
  validateProjectPermission,
} from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { UserRolesEnum, AvailableUserRole } from "../utils/constants.js";

const router = Router();


router.use(verifyJWT);

const privilegedRoles = [UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN];

router
  .route("/:projectId")
  .get(validateProjectPermission(AvailableUserRole), getTasks)
  .post(
    validateProjectPermission(privilegedRoles),
    upload.array("attachments", 5),
    createTask,
  );

router
  .route("/:projectId/t/:taskId")
  .get(validateProjectPermission(AvailableUserRole), getTaskById)
  .put(validateProjectPermission(privilegedRoles), updateTask)
  .delete(validateProjectPermission(privilegedRoles), deleteTask);

router
  .route("/:projectId/t/:taskId/subtasks")
  .post(validateProjectPermission(privilegedRoles), createSubTask);

router
  .route("/:projectId/st/:subtaskId")
  .put(validateProjectPermission(AvailableUserRole), updateSubTask)
  .delete(validateProjectPermission(privilegedRoles), deleteSubTask);

export default router;
