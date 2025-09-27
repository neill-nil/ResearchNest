module.exports = (sequelize, Sequelize) => {
    const Subtask = sequelize.define('Subtask', {
        subtask_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        task_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        name: {
            type: Sequelize.STRING(255),
            allowNull: false
        },
        status: {
            type: Sequelize.ENUM('Locked', 'In Progress', 'Completed'),
            defaultValue: 'Locked'
        }
    }, {
        tableName: 'Subtasks',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Subtask;
};