const axios = require('axios');
const { SIGNUP_USERS, OTPS, USERS, DETAILS } = require("../Database/Models");

const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
}

async function sendOTP(req, res) {
    try {
        const email = req.body.email;

        const user = await SIGNUP_USERS.findOne({
            userEmail: email,
        });

        console.log(user);

        const otp = generateOTP().toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await OTPS.create({
            otp: otp,
            userEmail: email,
            expiresAt: expiresAt,
        });

        // Send email via Brevo HTTP API (Port 443 - works on Render free tier)
        await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: {
                    name: "CampusConnect",
                    email: "campusconnectbyte@gmail.com" // Must be the email address you registered your Brevo account with
                },
                to: [{ email: email }],
                subject: "CampusConnect Email Verification",
                htmlContent: `
                    <h2>CampusConnect Email Verification</h2>
                    <p>Your verification OTP is : </p>
                    <h1>${otp}</h1>
                    <p>This OTP will expire in 10 minutes.</p>
                `
            },
            {
                headers: {
                    'api-key': process.env.BREVO_API_KEY,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );

        console.log("sent successfully via Brevo");
        return res.json({
            message: "successfully sent the OTP",
        });

    } catch (err) {
        console.log("Error in sendOTP:", err.response?.data || err.message);
        return res.status(500).json({
            message: "internal server error",
        });
    }
}

async function verifyOTP(req, res) {
    try {
        const {
            userEmail,
            otp
        } = req.body;

        const dataBaseOTP = await OTPS
            .findOne({
                userEmail: userEmail,
            })
            .sort({
                createdAt: -1,
                _id: -1,
            });

        if (!dataBaseOTP) {
            return res.status(400).json({
                message: "No OTP found for this email"
            });
        }

        console.log(otp, dataBaseOTP.otp);

        if (dataBaseOTP.expiresAt < Date.now()) {
            return res.status(400).json({
                message: "OTP expired"
            });
        } else {
            if (otp == dataBaseOTP.otp) {
                const user = await SIGNUP_USERS.findOne({
                    userEmail: userEmail,
                });

                if (!user) {
                    return res.status(404).json({
                        message: "Signup user not found"
                    });
                }

                const { _id, ...validUser } = user.toObject();

                const newValidUser = await USERS.create(validUser);

                await DETAILS.create({
                    userId: newValidUser._id,
                });

                return res.status(200).json({
                    message: "verified",
                    user: newValidUser
                });
            } else {
                return res.status(200).json({
                    message: "incorrect OTP"
                });
            }
        }

    } catch (err) {
        console.log("Error in the verifyOTP : " + err);
        return res.status(500).json({
            message: "internal server error"
        });
    }
}

module.exports = {
    sendOTP,
    verifyOTP,
};