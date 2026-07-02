const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Accept token from HTTP-only cookie (Next.js client) OR x-auth-token header (legacy CRA client)
  const token = req.cookies?.token || req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};
