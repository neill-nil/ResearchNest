const dbConfig = require('../config/db.config.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    pool: dbConfig.pool
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Student = require('./student.model.js')(sequelize, Sequelize);
db.Faculty = require('./faculty.model.js')(sequelize, Sequelize);
db.Milestone = require('./milestone.model.js')(sequelize, Sequelize);
db.Stage = require('./stage.model.js')(sequelize, Sequelize);
db.Task = require('./task.model.js')(sequelize, Sequelize);
db.Subtask = require('./subtask.model.js')(sequelize, Sequelize);
db.FacultyNote = require('./facultyNote.model.js')(sequelize, Sequelize);



db.Student.hasMany(db.Milestone, { foreignKey: 'student_id' });
db.Milestone.belongsTo(db.Student, { foreignKey: 'student_id' });

db.Milestone.hasMany(db.Stage, { foreignKey: 'milestone_id' });
db.Stage.belongsTo(db.Milestone, { foreignKey: 'milestone_id' });

db.Stage.hasMany(db.Task, { foreignKey: 'stage_id' });
db.Task.belongsTo(db.Stage, { foreignKey: 'stage_id' });

db.Task.hasMany(db.Subtask, { foreignKey: 'task_id' });
db.Subtask.belongsTo(db.Task, { foreignKey: 'task_id' });

db.Faculty.hasMany(db.Milestone, { foreignKey: 'frozen_by_faculty_id', as: 'FrozenMilestones' });
db.Faculty.hasMany(db.Milestone, { foreignKey: 'approved_by_faculty_id', as: 'ApprovedMilestones' });
db.Faculty.hasMany(db.Stage, { foreignKey: 'frozen_by_faculty_id', as: 'FrozenStages' });

db.Faculty.hasMany(db.FacultyNote, { foreignKey: 'faculty_id' });
db.FacultyNote.belongsTo(db.Faculty, { foreignKey: 'faculty_id' });

db.Student.hasMany(db.FacultyNote, { foreignKey: 'student_id' });
db.FacultyNote.belongsTo(db.Student, { foreignKey: 'student_id' });


module.exports = db;