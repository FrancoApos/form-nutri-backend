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
exports.FoodItem = void 0;
const typeorm_1 = require("typeorm");
const FoodCategory_1 = require("./FoodCategory");
const FoodResponse_1 = require("./FoodResponse");
let FoodItem = class FoodItem {
};
exports.FoodItem = FoodItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], FoodItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FoodItem.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => FoodCategory_1.FoodCategory, (category) => category.items),
    __metadata("design:type", FoodCategory_1.FoodCategory)
], FoodItem.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => FoodResponse_1.FoodResponse, (response) => response.food),
    __metadata("design:type", Array)
], FoodItem.prototype, "responses", void 0);
exports.FoodItem = FoodItem = __decorate([
    (0, typeorm_1.Entity)()
], FoodItem);
