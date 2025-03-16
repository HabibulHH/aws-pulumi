import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export class VpcNetwork {
    public readonly vpc: aws.ec2.Vpc;
    public readonly igw: aws.ec2.InternetGateway;
    public readonly publicSubnet: aws.ec2.Subnet;
    public readonly privateSubnet: aws.ec2.Subnet;
    public readonly natGateway: aws.ec2.NatGateway;
    public readonly publicRouteTable: aws.ec2.RouteTable;
    public readonly privateRouteTable: aws.ec2.RouteTable;

    constructor(name: string, cidrBlock = "10.0.0.0/16") {
        // Create VPC.
        this.vpc = new aws.ec2.Vpc(`${name}-vpc`, {
            cidrBlock: cidrBlock,
            enableDnsHostnames: true,
            tags: { Name: `${name}-vpc` },
        });

        // Create Internet Gateway.
        this.igw = new aws.ec2.InternetGateway(`${name}-igw`, {
            vpcId: this.vpc.id,
            tags: { Name: `${name}-igw` },
        });

        // Get the first available AZ.
        const az = aws.getAvailabilityZones().then(zones => zones.names[0]);

        // Create public subnet.
        this.publicSubnet = new aws.ec2.Subnet(`${name}-public-subnet`, {
            vpcId: this.vpc.id,
            cidrBlock: "10.0.1.0/24",
            availabilityZone: az,
            mapPublicIpOnLaunch: true,
            tags: { Name: `${name}-public-subnet` },
        });

        // Create private subnet.
        this.privateSubnet = new aws.ec2.Subnet(`${name}-private-subnet`, {
            vpcId: this.vpc.id,
            cidrBlock: "10.0.2.0/24",
            availabilityZone: az,
            mapPublicIpOnLaunch: false,
            tags: { Name: `${name}-private-subnet` },
        });

        // Allocate an Elastic IP for the NAT Gateway.
        const natEip = new aws.ec2.Eip(`${name}-nat-eip`, {
            vpc: true,
        });

        // Create a NAT Gateway in the public subnet.
        this.natGateway = new aws.ec2.NatGateway(`${name}-nat-gateway`, {
            allocationId: natEip.id,
            subnetId: this.publicSubnet.id,
            tags: { Name: `${name}-nat-gateway` },
        });

        // Create public route table (routes 0.0.0.0/0 to the IGW).
        this.publicRouteTable = new aws.ec2.RouteTable(`${name}-public-rt`, {
            vpcId: this.vpc.id,
            routes: [{
                cidrBlock: "0.0.0.0/0",
                gatewayId: this.igw.id,
            }],
            tags: { Name: `${name}-public-rt` },
        });

        new aws.ec2.RouteTableAssociation(`${name}-public-rt-assoc`, {
            subnetId: this.publicSubnet.id,
            routeTableId: this.publicRouteTable.id,
        });

        // Create private route table (routes 0.0.0.0/0 to the NAT Gateway).
        this.privateRouteTable = new aws.ec2.RouteTable(`${name}-private-rt`, {
            vpcId: this.vpc.id,
            routes: [{
                cidrBlock: "0.0.0.0/0",
                natGatewayId: this.natGateway.id,
            }],
            tags: { Name: `${name}-private-rt` },
        });

        new aws.ec2.RouteTableAssociation(`${name}-private-rt-assoc`, {
            subnetId: this.privateSubnet.id,
            routeTableId: this.privateRouteTable.id,
        });
    }
}
