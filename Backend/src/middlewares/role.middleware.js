import ApiError from "../utils/ApiError.js";
import { UserRoles } from "../constants/user.constants.js";

// OWNER only
 const isOwner = (req, res, next) => {
  if (req.user.role !== UserRoles.OWNER) {
    throw new ApiError(403, "Access denied: Owner only");
  }
  next();
};

// ADMIN only
 const isAdmin = (req, res, next) => {
  if (req.user.role !== UserRoles.ADMIN) {
    throw new ApiError(403, "Access denied: Admin only");
  }
  next();
};

// OWNER or ADMIN
 const isAdminOrOwner = (req, res, next) => {
  if (![UserRoles.OWNER, UserRoles.ADMIN].includes(req.user.role)) {
    throw new ApiError(403, "Access denied");
  }
  next();
};

// WORKER 
 const isWorker = (req, res, next) => {
  if (req.user.role !== UserRoles.WORKER) {
    throw new ApiError(403, "Access denied: Worker only");
  }
  next();
};


export {isOwner , isAdmin , isAdminOrOwner , isWorker } ;