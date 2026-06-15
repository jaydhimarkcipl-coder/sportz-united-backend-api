const { sequelize } = require('../src/config/database');

const sql = `
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tblArenaReview' and xtype='U')
BEGIN
    CREATE TABLE tblArenaReview (
        ReviewId INT IDENTITY(1,1) PRIMARY KEY,
        ArenaId INT NOT NULL FOREIGN KEY REFERENCES tblArena(ArenaId),
        PlayerId INT NOT NULL FOREIGN KEY REFERENCES tblPlayer(PlayerId),
        Rating DECIMAL(3,2) NOT NULL,
        ReviewText NVARCHAR(MAX) NULL,
        CreatedDate DATETIME DEFAULT GETDATE(),
        ModifiedDate DATETIME NULL
    );
END
`;

sequelize.query(sql).then(() => {
    console.log('Table created successfully');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
