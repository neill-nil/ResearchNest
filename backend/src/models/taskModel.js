module.exports = (sequelize, Sequelize) => {
    const Task = sequelize.define('Task', {
        task_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        stage_id: {
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
        },
        due_date: {
            type: Sequelize.DATEONLY,
            allowNull: true
        }
    }, {
        tableName: 'Tasks',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Task;
};