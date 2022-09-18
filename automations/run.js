const child_process = require("child_process");

async function run(cmd, env){
    console.log(`$> ${cmd}`);
    if(env == null){
        env = process.env;
    }
    else{
        env = {
            ...process.env,
            ...env
        }
    }
    return new Promise((yay, boo)=>{
        let parsedArgs = cmd.split(" ");
        let command = parsedArgs[0];
        let args = parsedArgs.slice(1);

        let proc = child_process.spawn(command, args, {stdio: "inherit", shell: true, env});

        proc.on('exit', (code)=>{
            if(code === 0){
                yay();
            }
            else{
                boo(code);
            }
        })
    });
}

async function pipe(cmd, env){
    console.log(`$> ${cmd}`);
    if(env == null){
        env = process.env;
    }
    else{
        env = {
            ...process.env,
            ...env
        }
    }
    return new Promise((yay, boo)=>{
        let parsedArgs = cmd.split(" ");
        let command = parsedArgs[0];
        let args = parsedArgs.slice(1);

        let proc = child_process.spawn(command, args, {stdio: "pipe", shell: true, env});

        let datas = [""];
        proc.stdout.on('data', (buf)=>{
            datas.push(buf.toString());
        })
        proc.stderr.on('data', (buf)=>{
            datas.push(buf.toString());
        })

        proc.on('exit', (code)=>{
            let output = datas.join("").replace(/\r\n/g, '\n').split("\n").filter(x => x !== "");
            if(code === 0){
                yay(output);
            }
            else{
                output.unshift(code);
                boo(output);
            }
        })
    });
}

function runBg(cmd, env){
    console.log(`$bg> ${cmd}`);
    if(env == null){
        env = process.env;
    }
    else{
        env = {
            ...process.env,
            ...env
        }
    }
    let parsedArgs = cmd.split(" ");
    let command = parsedArgs[0];
    let args = parsedArgs.slice(1);

    let proc = child_process.spawn(command, args, {stdio: "inherit", shell: true, env});

    return proc;
}

module.exports = {
    run,
    pipe,
    runBg
}