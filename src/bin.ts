import { calistir } from './cli';

const { cikti, kod } = calistir(process.argv.slice(2));
const hedef = kod === 0 ? process.stdout : process.stderr;
hedef.write(cikti.endsWith('\n') ? cikti : `${cikti}\n`);
process.exitCode = kod;
