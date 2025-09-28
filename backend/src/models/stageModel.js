module.exports = (sequelize, Sequelize) => {
    const Stage = sequelize.define('Stage', {
        stage_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        milestone_id: {
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
        is_frozen: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        frozen_by_faculty_id: {
            type: Sequelize.STRING(7),
            allowNull: true
        },
        frozen_at: {
            type: Sequelize.DATE,
            allowNull: true
        }
    }, {
        tableName: 'Stages',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Stage;
};