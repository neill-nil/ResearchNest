module.exports = (sequelize, Sequelize) => {
    const Faculty = sequelize.define('Faculty', {
        faculty_id: {
            type: Sequelize.STRING(7),
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        email: {
            type: Sequelize.STRING(100),
            allowNull: false,
            unique: true
        },
        password_hash: {
            type: Sequelize.STRING(255),
            allowNull: false
        },
        department: Sequelize.STRING(100)
    }, {
        tableName: 'Faculty',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false // Schema doesn't have updated_at
    });
    return Faculty;
};