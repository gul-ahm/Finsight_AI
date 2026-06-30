
import { prisma } from '@/backend/db';

async function main() {
    console.log('Checking prisma.rateLimit...');
    // @ts-ignore
    if (prisma.rateLimit) {
        console.log('SUCCESS: prisma.rateLimit exists!');
    } else {
        console.error('FAILURE: prisma.rateLimit DOES NOT exist!');
        process.exit(1);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
