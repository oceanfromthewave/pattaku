const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "토큰 없음" });
  let token = authHeader;
  if (token.startsWith("Bearer ")) token = token.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "my_jwt_secret"
    );
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "토큰 불일치/만료" });
  }
};
