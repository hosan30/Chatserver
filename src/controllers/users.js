const jwt = require("jsonwebtoken");
const { hashPassword, comparePassword } = require("../helpers/auth");
const UserModel = require("../models/UserModel");

exports.registration = async (req, res) => {
  try {
    const { name, email, password, photoUrl } = req.body;
    console.log(req.body);
    if (!name.trim()) {
      return res.json({ status: 400, error: "Name is required" });
    }
    if (email) {
      const mailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!email.match(mailFormat)) {
        return res.json({
          status: 400,

          error: "Please enter a valid email",
        });
      }
    }
    if (!email) {
      return res.json({
        status: 400,

        error: "Email is required",
      });
    }
    if (!password || password.length < 6) {
      return res.json({
        status: 400,
        error: "Password must be at least 6 characters long",
      });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.json({
        status: 400,

        error: "Email is taken",
      });
    }
    const hashedPassword = await hashPassword(password);

    if (!existingUser) {
      const user = await new UserModel({
        name,
        email,
        password: hashedPassword,
        photoUrl,
      }).save();

      let Payload = {
        exp: Math.floor(Date.now() / 1000) * (24 * 60 * 60),
        data: { _id: user._id, email: user.email, photoUrl: user.photoUrl, name: user.name, deviceId: user.deviceId },
      };
      console.log(user, Payload)
      const token = jwt.sign(Payload, process.env.JWT_SECRET);

      res.json({
        status: 200,
        message: "Registration Success",
        user: {
          name: user.name,
          email: user.email,
        },
        token,
      });
    }
  } catch (err) {
    console.log(err);
  }
};
exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.json({
      status: 400,
      error: "Enter an email",
    });
  }
  if (!password || password.length < 6) {
    return res.json({
      status: 400,

      error: "Password must be at least 6 characters long",
    });
  }

  UserModel.findOne({ email }, async (err, data) => {
    try {
      if (!err) {
        const match = await comparePassword(password, data.password);
        if (!match) {
          res.json({
            status: 400,

            error: "Password is incorrect",
          });
        } else {
          const user = {
            _id: data._id,
            email: data.email,
            photoUrl: data.photoUrl,
            name: data.name,
            deviceId: data.deviceId
          };

          let Payload = {
            exp: Math.floor(Date.now() / 1000) * (24 * 60 * 60),
            data: user,
          };
        //   console.log(Payload);
          let token = jwt.sign(Payload, process.env.JWT_SECRET);
          res.json({
            status: 200,

            message: "Login Success",
            data: data,
            token,
          });
        }
      }
    } catch {
      res.json({
        status: 400,

        error: "User not found",
      });
    }
  });
};

exports.updateProfile = (req, res) => {

  let { deviceId, userId } = req.body;
  console.log(deviceId, userId);
  UserModel.findByIdAndUpdate(
    userId,
    { $set: { deviceId } },
    { new: true },
    (err, data) => {
      if (err) {
        res.status(400).json({
          status: "Fail to Update",
          data: err,
        });
      } else {
        res.status(200).json({
          status: "Updated Successfully",
          data: data,
        });
      }
    }
  );
};

exports.selectProfile = (req, res) => {
  let email = req.headers["email"];
  UserModel.findOne({ email: email }, (err, data) => {
    if (err) {
      res.status(400).json({
        status: "Fail to Update",
        data: err,
      });
    } else {
      res.status(200).json({
        status: "User profile getteing successfully",
        data: data,
      });
    }
  });
};

exports.getUser = (req, res) => {
  let id = req.params.id;
  UserModel.findOne({ _id: id }, (err, data) => {
    if (err) {
      res.status(400).json({
        status: "Fail to Get",
        data: err,
      });
    } else {
      res.status(200).json({
        status: "User profile getteing successfully",
        data: data,
      });
    }
  });
};
