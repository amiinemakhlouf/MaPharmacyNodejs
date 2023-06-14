const { Sequelize, DataTypes } = require('sequelize');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');





// Create a Sequelize instance using the DATABASE_URL environment variable
const sequelize = new Sequelize('postgres://postgres:mysecret@localhost:5437/postgres', {
  dialect: 'postgres',
});


// Define the Account model
const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING
  },
  username: {
    type: DataTypes.STRING,
  }
});

const Admin = sequelize.define('Admin', {
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'admin'
});

const Pharmacy = sequelize.define('Pharmacy', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  streetName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  workingHourStart: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  workingHourEnd: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rate: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
});


const Reminder = sequelize.define('Reminder', {
  medicationName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dose: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  reminderTime: {
    type: DataTypes.STRING,
    allowNull: false
  },
  personName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  startDate:{
    type:DataTypes.STRING

  },
  endDate:{
    type:DataTypes.STRING
  },
  moment:{
    type:DataTypes.INTEGER
  }
  ,
  days:{
    type:DataTypes.STRING
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
      key: 'email'
    }
  }
});
const Medication = sequelize.define('Medication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  codabar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  additionalDescription: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});






// Define the association with the User model
Reminder.belongsTo(User, { foreignKey: 'userEmail', targetKey: 'email' });

// Define hooks to hash passwords before creating and updating users and admins
User.beforeCreate(async (user) => {
  if (user.password) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
  }
});

User.beforeUpdate(async (user) => {
  if (user.password) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
  }
});

Admin.beforeCreate(async (admin) => {
  if (admin.password) {
    const hashedPassword = await bcrypt.hash(admin.password, 10);
    admin.password = hashedPassword;
  }
});

// Sync the models with the database
sequelize.sync()
  .then(() => {
    console.log('Models synced with the database.');
  })
  .catch((error) => {
    console.error('Error syncing models:', error);
  });

// Create an admin record
Admin.create({
  email: 'amiinemakhlouf@gmail.com',
  password: '12345678'
})
  .then((admin) => {
    console.log('Admin record created:', admin);
  })
  .catch((error) => {
    console.error('Error creating admin record:', error);
  });





/*User.beforeCreate(async (user, options) => {
  if(user.password)
  {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
  }
  
});
User.beforeUpdate(async (user, options) => {
  if(user.password){
    const hashedPassword = await bcrypt.hash(user.password, 10);
  user.password = hashedPassword;

  }
  
});
*/

/*User.destroy({ where: { email: 'amiinemakhlouf@gmail.com' } })
  .then(() => {
    console.log('Users deleted');
  })
  .catch((error) => {
    console.error(error);
  });
 */
  

  const listOfOtpRegister=[]
  const listOfOtpReset=[]


// Create an Express app
const express = require('express');
const app = express();
app.use(cors())
app.use(bodyParser.json());

// Parse URL-encoded request body
app.use(bodyParser.urlencoded({ extended: true }));


// Register a route for registering new accounts

app.post('/api/register', async (req, res) => {
  const { email, password, username } = req.body;

  try{
  const user = await User.findOne({ 
    where: { 
      email: email,
      password: {
        [Sequelize.Op.not]: null // Use Sequelize.Op.not to specify "not null" condition
      }
    }
  });

  if (user) {
    res.status(500).json("User already exists");
    console.log(user);
  } else {
    const code = generateRandomString();
    sendEmailOtp(email, code);
    listOfOtpRegister.push({code: code, email: email, password: password, username: username,lifeTime:Date.now()+300000});
    console.log( "my code is"+code)
    console.log("my code is"+email)
    res.status(200).json({response: "one more step"});
  } 
} catch (error) {
  console.log(error);
  res.status(500).json("Something went wrong");
}





});


  


// Register a endpoint for sending a confirmation email

app.post('/api/account/confirmation', async(req, res) => {
  console.log("ahlem la tanam")
  const { email, code } = req.body;
  let otpFound = false;
  var password = "";
  var username = "";
  console.log(email+"is my email")

  for (const otp of listOfOtpRegister) {
    console.log("the code    "+ otp.code)
    console.log("the email    " +otp.email)
    if (otp.code == code && otp.email == email ) {
      otpFound = true;
      console.log("equal")
      password = otp.password;
      console.log("password is "+password)
      username = otp.username;
      break;
    }
    else
    {
      
    }
  }

  if (otpFound) {
    try {
      await sequelize.sync();

      const user = await User.findOrCreate({
        where: { email: email  }, // Search by email
        
         // Default values for creating new record, including fields to update
      }).then(([user, created]) => {
        console.log("inserted")
      console.log(password)
      user.password=password
      user.username=username
      user.save()
      const payload = { user: user.id };
      const options = { expiresIn: '1h' }; // Example options for JWT expiration time

      const token = jwt.sign(payload, "secretKey", options);
      res.set('Authorization', `Bearer ${token}`); // Update headers with res.set()

      console.log(token);

      res.status(200).json({ username: "welcome" });
      })
     .catch((error)=>{
      console.log("inseted1")
      console.log("Error:", error.message);
      User.create({email:email,password:password,username:"hedi"}).then(
       user =>{
        const payload = { user: user.id };
        const options = { expiresIn: '1h' }; // Example options for JWT expiration time
  
        const token = jwt.sign(payload, "secretKey", options);
        res.set('Authorization', `Bearer ${token}`); // Update headers with res.set()
  
        console.log(token);
  
        res.status(200).json({ username: "welcome" });
  
       } 
      )
      


     })
    } catch (error) {
      console.error(error);
      res.status(500).json({ response: "Something went wrong" });
    }
  } else {
    res.status(406).send("wrong password");
  }
});

// Start the Express app
const port = process.env.PORT || 3010;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

// Authenticate to the database and save a new user
async function main() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    
      
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } 
}
function generateRandomString () {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

function sendEmailOtp(email,code)
{
  const nodeMailer = require('nodemailer');
const mailTransporter = nodeMailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mapharmacieotp@gmail.com',
    pass: 'rppelscerzghmcsb',
  },
});

const details = {
  from: 'mapharmacieotp@gmail.com',
  to: email,
  subject: 'otp confirmation',
  text: code,
};

  mailTransporter.sendMail(details, (err) => {
    if (err) {
      console.log('email not sent', err);
      
    } else {
      console.log('email sent');

      res.send('Confirmation email sent');
      listOfOtpRegister.push({email:email,code:code,lifeTime:Date.now()+300000})
      console.log("i saved pbro")
    }
  });
  
}

// login
app.post('/api/login', async (req, res) => {
  console.log("hello");
  const { email, password } = req.body;
  console.log(password);
  
  if (password) {
    try {
      const user = await User.findOne({
        where: {
          email: email
        }
      });

      if (user) {
        console.log("hechmi");
        console.log(email);


        const myPassword= await bcrypt.hash(password,10);
        console.log(myPassword)
        const result = await bcrypt.compare(password, user.password);
        console.log("is password match"+ result)
        console.log("bassword "+password)
        console.log("hashed bassword  "+user.password)
        if (result) {
          console.log('User logged in successfully!');
          const payload = { user: user.id };
          const options = { expiresIn: '1h' }; // Example options for JWT expiration time
          const token = jwt.sign(payload, "secretKey", options);
          res.set('Authorization', `Bearer ${token}`);
          console.log("riadh");
          res.status(200).json({ username: user.username, email: user.email });
        } else {
          console.log("bora");
          res.status(400).send("Mot de passe incorrect");
        }
      } else {
        console.log("jilani");
        res.status(400).send("Email inexistant");
      }
    } catch (error) {
      console.error(error);
      console.log("ezzedine");
    }
  } else {
    res.status(400).send("Mot de passe manquant");
  }
});



//forgetPAssword
app.post('/api/user/reset_password', async(req, res) => {

  const { email } = req.body;

  const emailExists = await User.findOne({ where: { email: email }});
if (emailExists) {
  const code= generateRandomString()
  sendEmailOtp(email,code)
  listOfOtpReset.push({email:email,code:code,lifeTime:Date.now()+300000})
        res.status(200).json({response:"email exist"})
        
} else {
  
  res.status(400).send("aucun compte lié a cet email")
}
})

app.post('/api/usr/otp_check',(req,res)=>{

  const{email,code}=req.body
  let otpFound = false;


for (const otp of listOfOtpReset) {
    if (otp.code === code && otp.email === email && Date.now()<otp.lifeTime   ) {
      otpFound = true;
      break;
    }
  }

  if (otpFound) {

    res.status(200).json({response:"correct code"})
    

  } else {
    res.status(400).send("wrong code");
  }
  
})
app.post('/api/password/reset', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: email } });

    if (!user) {
      // Handle case where user is not found
      console.log("user not found")
      return res.status(404).json({ error: "User not found" });
    }

    user.password = password;
    console.log("user exist")
    await user.save();

    res.status(200).json({ success: "Password updated successfully" });
  } catch (error) {
    
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/reminder/save', async (req, res) => {
 
 /* const token = req.headers.authorization.substring(7);
  console.log(token)
  const decoded = jwt.verify(token, "secretKey");
  const {email}=decoded
 console.log("3eljia")
  console.log(email)*/
 


 
  try {
    const { medicationName, dose, reminderTime, personName,startDate,endDate,days, userEmail,moment } = req.body;

    // Create a new Reminder instance with the provided values
    const reminder = await Reminder.create({
      medicationName,
      dose,
      reminderTime,
      personName,
      startDate,
      endDate,
      userEmail,
      moment,
      days
    });

    // Return the created reminder JSON to the frontend
    res.json(reminder.toJSON());
  } catch (error) {
    // Handle any errors that occur during the saving process
    console.error(error);
    res.status(500).json({ error: 'Failed to save the reminder' });
  }
});
app.get('/api/reminders', async (req, res) => {
  try {
    // Fetch all reminders from the database
    const reminders = await Reminder.findAll();

    // Return the reminders as JSON response
    res.json(reminders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});


app.post('/api/pharmacy/save', async (req, res) => {
  try {
    const { name, streetName, workingHourStart,workingHourEnd, phoneNumber, rate } = req.body;
    // Create a new pharmacy instance
    const pharmacy = await Pharmacy.create({ name, streetName, workingHourStart,workingHourEnd, phoneNumber, rate });
    // Send a success response
    res.status(201).json({ success: true, pharmacy });
  } catch (error) {
    console.error('Error saving pharmacy:', error);
    // Send an error response
    res.status(500).json({ success: false, error: 'Failed to save pharmacy' });
  }
});
app.get('/api/pharmacy', async (req, res) => {
  try {
    // Retrieve all pharmacies from the database
    const pharmacies = await Pharmacy.findAll();

    // Send the pharmacies as the response
    res.json(pharmacies);
  } catch (error) {
    console.error('Error retrieving pharmacies:', error);
    // Send an error response
    res.status(500).json({ success: false, error: 'Failed to retrieve pharmacies' });
  }
});


app.post('/apo', async (req, res) => {
  
    const { email, username } = req.body;
    try {
      const user = await User.findOne({
        where: {
          email: email
        }
      });
      if (user) {

        const payload = { user: user.id };
        const options = { expiresIn: '1h' }; // Example options for JWT expiration time
  
        const token = jwt.sign(payload, "secretKey", options);
        res.set('Authorization', `Bearer ${token}`); // Update headers with res.set()
  
        console.log(token);
  
        res.status(200).json({ username: username,email:email });
      

      } else {
        await sequelize.sync();

        const user = await User.create({ email:email,username:username, });
        const payload = { user: user.id };
        const options = { expiresIn: '1h' }; // Example options for JWT expiration time
  
        const token = jwt.sign(payload, "secretKey", options);
        res.set('Authorization', `Bearer ${token}`); // Update headers with res.set()
  
        console.log(token);
  
        res.status(200).json({ username: user.username,email:user.email });
      
      }
    } catch (error) {
      console.error('Error occurred:', error);
    }
});


app.post('/api/admin/login', async (req, res) => {
  // Perform authentication logic and verify the credentials
  console.log("before email")
  const { email, password } = req.body;
  console.log(email)
  console.log(password)

  try {
    const admin = await Admin.findOne({ where: { email } });

    if (admin) {
      const passwordMatch = await bcrypt.compare(password, admin.password);
      console.log("is password match"+ passwordMatch)

      if (passwordMatch) {
        // Generate the JWT
        const token = jwt.sign({ email: admin.email }, "secretKey");

        // Send the JWT as a Bearer token in the response
        res.status(200).json({ token: `Bearer ${token}` });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error authenticating admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const multer = require('multer');
const path = require('path');

// Define the storage configuration
const storage = multer.diskStorage({
  destination: '/home/amine/Desktop/', // Specify the destination directory
  filename: (req, file, callback) => {
    const fileName = file.originalname;
    callback(null, fileName); // Use the original file name
  }
});

const upload = multer({ storage });
app.post('/medication/save', upload.single('image'), async (req, res) => {
  try {
    // Access the uploaded image file using req.file
    const image = req.file;

    // Access the medication object from req.body
    const medication = JSON.parse(req.body.medication);

    // Perform any necessary operations with the image and medication data
    // For example, save the image to the desired location and create a medication record

    // Get the file path of the saved image
    const savedImagePath = path.join('/home/amine/Desktop/', image.originalname);

    // Create a medication record
    const createdMedication = await Medication.create({ ...medication, image: savedImagePath });

    res.json(createdMedication);
  } catch (error) {
    res.status(500).json({ error: 'Unable to create medication' });
  }
});








app.get('/get/all/medications', async (req, res) => {
  try {
    const medications = await Medication.findAll();
    res.json(medications);
  } catch (error) {
    res.status(500).json({ error: 'Unable to retrieve medications' });
  }
});

app.use(cors());



// Call the main function to authenticate and save a new user
main();
