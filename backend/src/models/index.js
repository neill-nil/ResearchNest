const dbConfig = require('../config/dbConfig.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    pool: dbConfig.pool
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Student = require('./studentModel.js')(sequelize, Sequelize);
db.Faculty = require('./facultyModel.js')(sequelize, Sequelize);
db.Milestone = require('./milestoneModel.js')(sequelize, Sequelize);
db.Stage = require('./stageModel.js')(sequelize, Sequelize);
db.Task = require('./taskModel.js')(sequelize, Sequelize);
db.Subtask = require('./subtaskModel.js')(sequelize, Sequelize);
db.FacultyNote = require('./facultyNoteModel.js')(sequelize, Sequelize);


db.Student.hasMany(db.Milestone, { foreignKey: 'student_id' });
db.Milestone.belongsTo(db.Student, { foreignKey: 'student_id' });

db.Milestone.hasMany(db.Stage, { foreignKey: 'milestone_id' });
db.Stage.belongsTo(db.Milestone, { foreignKey: 'milestone_id' });

db.Stage.hasMany(db.Task, { foreignKey: 'stage_id' });
db.Task.belongsTo(db.Stage, { foreignKey: 'stage_id' });

db.Task.hasMany(db.Subtask, { foreignKey: 'task_id' });
db.Subtask.belongsTo(db.Task, { foreignKey: 'task_id' });

db.Faculty.hasMany(db.Milestone, { foreignKey: 'frozen_by_faculty_id', as: 'FrozenMilestones' });
db.Milestone.belongsTo(db.Faculty, { foreignKey: 'frozen_by_faculty_id', as: 'FrozenByFaculty' });

db.Faculty.hasMany(db.Milestone, { foreignKey: 'approved_by_faculty_id', as: 'ApprovedMilestones' });
db.Milestone.belongsTo(db.Faculty, { foreignKey: 'approved_by_faculty_id', as: 'ApprovedByFaculty' });

db.Faculty.hasMany(db.Stage, { foreignKey: 'frozen_by_faculty_id', as: 'FrozenStages' });
db.Stage.belongsTo(db.Faculty, { foreignKey: 'frozen_by_faculty_id', as: 'FrozenByFaculty' });

db.Faculty.hasMany(db.FacultyNote, { foreignKey: 'faculty_id' });
db.FacultyNote.belongsTo(db.Faculty, { foreignKey: 'faculty_id' });

db.Student.hasMany(db.FacultyNote, { foreignKey: 'student_id' });
db.FacultyNote.belongsTo(db.Student, { foreignKey: 'student_id' });

db.Milestone.hasMany(db.FacultyNote, { foreignKey: 'milestone_id' });
db.FacultyNote.belongsTo(db.Milestone, { foreignKey: 'milestone_id' });

db.Stage.hasMany(db.FacultyNote, { foreignKey: 'stage_id' });
db.FacultyNote.belongsTo(db.Stage, { foreignKey: 'stage_id' });

db.Task.hasMany(db.FacultyNote, { foreignKey: 'task_id' });
db.FacultyNote.belongsTo(db.Task, { foreignKey: 'task_id' });

db.Subtask.hasMany(db.FacultyNote, { foreignKey: 'subtask_id' });
db.FacultyNote.belongsTo(db.Subtask, { foreignKey: 'subtask_id' });

module.exports = db;
