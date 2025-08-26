"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodResponse = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const FoodItem_1 = require("./FoodItem");
let FoodResponse = class FoodResponse {
};
exports.FoodResponse = FoodResponse;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], FoodResponse.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.responses),
    __metadata("design:type", User_1.User)
], FoodResponse.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => FoodItem_1.FoodItem, (food) => food.responses),
    __metadata("design:type", FoodItem_1.FoodItem)
], FoodResponse.prototype, "food", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FoodResponse.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FoodResponse.prototype, "frequency", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], FoodResponse.prototype, "observations", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], FoodResponse.prototype, "createdAt", void 0);
exports.FoodResponse = FoodResponse = __decorate([
    (0, typeorm_1.Entity)()
], FoodResponse);
