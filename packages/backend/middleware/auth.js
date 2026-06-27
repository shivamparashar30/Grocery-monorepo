// const jwt = require('jsonwebtoken');
// const asyncHandler = require('./async');
// const User = require('../models/user');
// const ErrorResponse = require('../utils/errorResponse');

// // Protect routes
// exports.protect = asyncHandler(async (req, res, next) => {
//   let token;
  
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer')
//   ) {
//     token = req.headers.authorization.split(' ')[1];
//   }
  
//   // Make sure token exists
//   if (!token) {
//     return next(new ErrorResponse('Not Authorized to access this route', 401));
//   }
  
//   try {
//     // Verify Token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log(decoded);
//     req.user = await User.findById(decoded.id);
//     next();
//   } catch (error) {
//     return next(new ErrorResponse('Not Authorized to access this route', 401));
//   }
// });

// // Grant access to specific roles
// exports.authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return next(
//         new ErrorResponse(
//           `User role ${req.user.role} is not authorized to access this route`,
//           403
//         )
//       );
//     }
//     next();
//   };
// };

const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const User = require('../models/user');
const ErrorResponse = require('../utils/errorResponse');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorResponse('User no longer exists', 401));
    }

    // ✅ Block check — works for all roles
    if (user.isBlocked) {
      return next(
        new ErrorResponse('Your account has been blocked. Contact support.', 403)
      );
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
// Usage: authorize('admin'), authorize('admin', 'driver'), etc.
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};