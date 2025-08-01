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
exports.Role = void 0;
const typeorm_1 = require("typeorm");
const Usuario_1 = require("./Usuario");
const class_transformer_1 = require("class-transformer");
let Role = class Role {
};
exports.Role = Role;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'SEQ', type: 'number', precision: 19, scale: 2 }),
    __metadata("design:type", Number)
], Role.prototype, "seq", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'DESCRICAO', type: 'varchar2', length: 10, nullable: false }),
    __metadata("design:type", String)
], Role.prototype, "descricao", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: 'PUBLISH',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP'
    }),
    __metadata("design:type", Date)
], Role.prototype, "publish", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Usuario_1.Usuario, usuario => usuario.roles),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", Array)
], Role.prototype, "usuarios", void 0);
exports.Role = Role = __decorate([
    (0, typeorm_1.Entity)('ROLE')
], Role);
