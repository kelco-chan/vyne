"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
console.log(process.env.DATABASE_URL);
async function main() {
    // Connect the client
    await prisma.$connect();
    // ... you will write your Prisma Client queries here
    await prisma.session.create({
        data: {
            started: new Date(),
            guild: {
                connectOrCreate: {
                    where: {
                        id: "1234567890"
                    },
                    create: {
                        id: "1234567890"
                    }
                }
            },
            voiceChannel: "62uygausd",
            participants: {
                connectOrCreate: [{
                        where: {
                            id: "123123123",
                        },
                        create: {
                            id: "1weasdasd",
                            joined: new Date()
                        }
                    }]
            }
        }
    });
}
main()
    .catch((e) => {
    throw e;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=dbtest.js.map