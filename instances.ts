import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

async function getAmiId(): Promise<string> {
    const ami = await aws.ec2.getAmi({
        mostRecent: true,
        owners: ["amazon"],
        filters: [{ name: "name", values: ["amzn2-ami-hvm-*-x86_64-gp2"] }],
    });
    return ami.id;
}

export class BastionHost {
    public readonly instance: aws.ec2.Instance;
    constructor(name: string, subnetId: pulumi.Input<string>, securityGroupIds: pulumi.Input<string>[], keyName: string) {
        this.instance = new aws.ec2.Instance(name, {
            instanceType: "t3.micro",
            subnetId: subnetId,
            vpcSecurityGroupIds: securityGroupIds,
            associatePublicIpAddress: true,
            keyName: keyName,
            ami: getAmiId(),
            tags: { Name: name },
        });
    }
}

export class NginxInstance {
    public readonly instance: aws.ec2.Instance;
    constructor(name: string, subnetId: pulumi.Input<string>, securityGroupIds: pulumi.Input<string>[]) {
        this.instance = new aws.ec2.Instance(name, {
            instanceType: "t3.micro",
            subnetId: subnetId,
            vpcSecurityGroupIds: securityGroupIds,
            associatePublicIpAddress: true,
            ami: getAmiId(),
            userData: `#!/bin/bash
sudo yum update -y
sudo amazon-linux-extras install nginx1 -y
sudo systemctl start nginx
sudo systemctl enable nginx
`,
            tags: { Name: name },
        });
    }
}

export class PostgresInstance {
    public readonly instance: aws.ec2.Instance;
    constructor(name: string, subnetId: pulumi.Input<string>, securityGroupIds: pulumi.Input<string>[]) {
        this.instance = new aws.ec2.Instance(name, {
            instanceType: "t3.micro",
            subnetId: subnetId,
            vpcSecurityGroupIds: securityGroupIds,
            associatePublicIpAddress: false,
            ami: getAmiId(),
            userData: `#!/bin/bash
sudo yum update -y
sudo amazon-linux-extras install postgresql12 -y
sudo yum install postgresql12-server -y
sudo /usr/pgsql-12/bin/postgresql-12-setup initdb
sudo systemctl start postgresql-12
sudo systemctl enable postgresql-12
`,
            tags: { Name: name },
        });
    }
}
