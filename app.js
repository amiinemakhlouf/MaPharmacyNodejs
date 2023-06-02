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
      type: DataTypes.STRING,
     
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
      }
      

  }
);
User.sync();
const Admin = sequelize.define('Admin', {
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
   
  },
    

},  {tableName: 'admin' }// Specify the table name here

);

const Reminder = sequelize.define('Reminder', {
  medicationName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dose: {
    type: DataTypes.STRING,
    allowNull: false
  },
  time: {
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
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'email'
    }
  }
}, {
  // You can specify additional configuration options here
});

// Define the association with the User model
Reminder.belongsTo(User, { foreignKey: 'userEmail', targetKey: 'email' });

// Now you can synchronize the models with the database to create the tables
// (Make sure your Sequelize instance is properly configured before running this)
Reminder.sync();
User.sync();


Admin.beforeCreate(async (admin, options) => {
  if(admin.password)
  {
    const hashedPassword = await bcrypt.hash(admin.password, 10);
    admin.password = hashedPassword;
  }
  
});
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
sequelize.sync()
  .then(() => {
    console.log('Models synced with the database.');
  })
  .catch((error) => {
    console.error('Error syncing models:', error);
  });




User.beforeCreate(async (user, options) => {
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

User.destroy({ where: { email: 'amiinemakhlouf@gmail.com' } })
  .then(() => {
    console.log('Users deleted');
  })
  .catch((error) => {
    console.error(error);
  });
 
  

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


  


// Register a route for sending a confirmation email

app.post('/api/account/confirmation', async(req, res) => {
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
        where: { email: email }, // Search by email
        
         // Default values for creating new record, including fields to update
      }).then(([user, created]) => {
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
     .catch(()=>{
      User.create({email:email,username,email:email,password:password}).then(
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
app.post('/api/login', async(req, res) => {
  const { email, password } = req.body;
  if(password){

  

  User.findOne({
    where: {
      email: email
    }
  })
  .then((user) => {
    if (user) {
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          console.error(err);
          return;
        }
    
        if (result) {
          console.log('User', "amiine", 'logged in successfully!');
          const payload = { user: user.id };
          const options = { expiresIn: '1h' }; // Example options for JWT expiration time
  
          const token = jwt.sign(payload, "secretKey", options);
        res.set('Authorization', `Bearer ${token}`); // Upd

          res.status(200).json({username:user.username,email:user.email})
        } else {
          
          res.status(400).send("Mot de passe incorrect")
        }
      });


    } else {
      res.status(400).send("Email inexistant")
    }
  })
  .catch((error) => {
    console.error(error);
  });
} else{
  res.status(400).send("Email inexistant")

}


  
})


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
  
    const { medicationName, patientName,form,description,firstDate,endDate } = req.body;
    medicationName
    
  
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

app.use(cors());



// Call the main function to authenticate and save a new user
main();
