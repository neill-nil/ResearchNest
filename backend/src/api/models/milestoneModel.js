module.exports = (sequelize, Sequelize) => {
    const Milestone = sequelize.define('Milestone', {
        milestone_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        student_id: {
            type: Sequelize.STRING(8),
            allowNull: false
        },
        name: {
            type: Sequelize.STRING(255),
            allowNull: false
        },
        department: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        status: {
            type: Sequelize.ENUM('Locked', 'Open', 'In Progress', 'Pending Approval', 'Completed'),
            defaultValue: 'Locked'
        },
        is_frozen: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        frozen_by_faculty_id: Sequelize.STRING(7),
        frozen_at: Sequelize.DATE,
        approved_by_faculty_id: Sequelize.STRING(7),
        approved_at: Sequelize.DATE
    }, {
        tableName: 'Milestones',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    return Milestone;
};