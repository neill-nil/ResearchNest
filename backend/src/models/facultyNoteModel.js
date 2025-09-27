module.exports = (sequelize, Sequelize) => {
    const FacultyNote = sequelize.define('FacultyNote', {
        note_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        faculty_id: {
            type: Sequelize.STRING(7),
            allowNull: false
        },
        student_id: {
            type: Sequelize.STRING(8),
            allowNull: true
        },
        milestone_id: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        stage_id: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        task_id: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        subtask_id: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        note: {
            type: Sequelize.TEXT,
            allowNull: false
        }
    }, {
        tableName: 'FacultyNotes',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false 
    });

    return FacultyNote;
};