import * as pulumi from "@pulumi/pulumi";
import { VpcNetwork } from "./vpc";
import { BastionSecurityGroup, NginxSecurityGroup, PostgresSecurityGroup } from "./security";
import { BastionHost, NginxInstance, PostgresInstance } from "./instances";

// Create the VPC and associated network components.
const network = new VpcNetwork("my-network");

// Create security groups.
const bastionSg = new BastionSecurityGroup(network.vpc.id);
const nginxSg = new NginxSecurityGroup(network.vpc.id);
const postgresSg = new PostgresSecurityGroup(network.vpc.id, nginxSg.sg.id);

// Create instances.
// Bastion host (for SSH access) in the public subnet.
const bastion = new BastionHost("bastion-host", network.publicSubnet.id, [bastionSg.sg.id], "your-ssh-key-name");

// Nginx server in the public subnet.
const nginx = new NginxInstance("nginx-instance", network.publicSubnet.id, [nginxSg.sg.id]);

// PostgreSQL server in the private subnet.
const postgres = new PostgresInstance("pg-instance", network.privateSubnet.id, [postgresSg.sg.id]);

// Export useful values.
export const bastionPublicIp = bastion.instance.publicIp;
export const nginxPublicIp = nginx.instance.publicIp;
