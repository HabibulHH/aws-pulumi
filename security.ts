import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export class BastionSecurityGroup {
    public readonly sg: aws.ec2.SecurityGroup;
    constructor(vpcId: pulumi.Input<string>) {
        this.sg = new aws.ec2.SecurityGroup("bastion-sg", {
            vpcId: vpcId,
            description: "Allow SSH access to Bastion host",
            ingress: [{
                protocol: "tcp",
                fromPort: 22,
                toPort: 22,
                // For production, restrict this to your trusted IP addresses.
                cidrBlocks: ["0.0.0.0/0"],
            }],
            egress: [{
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
            }],
            tags: { Name: "bastion-sg" },
        });
    }
}

export class NginxSecurityGroup {
    public readonly sg: aws.ec2.SecurityGroup;
    constructor(vpcId: pulumi.Input<string>) {
        this.sg = new aws.ec2.SecurityGroup("nginx-sg", {
            vpcId: vpcId,
            description: "Allow HTTP access to Nginx server",
            ingress: [{
                protocol: "tcp",
                fromPort: 80,
                toPort: 80,
                cidrBlocks: ["0.0.0.0/0"],
            }],
            egress: [{
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
            }],
            tags: { Name: "nginx-sg" },
        });
    }
}

export class PostgresSecurityGroup {
    public readonly sg: aws.ec2.SecurityGroup;
    constructor(vpcId: pulumi.Input<string>, allowedSgId: pulumi.Input<string>) {
        this.sg = new aws.ec2.SecurityGroup("pg-sg", {
            vpcId: vpcId,
            description: "Allow PostgreSQL access only from Nginx server",
            ingress: [{
                protocol: "tcp",
                fromPort: 5432,
                toPort: 5432,
                // Only allow connections from the specified security group.
                securityGroups: [allowedSgId],
            }],
            egress: [{
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
            }],
            tags: { Name: "pg-sg" },
        });
    }
}
