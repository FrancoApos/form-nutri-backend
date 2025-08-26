"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const data_source_1 = require("./data-source");
const formRoutes_1 = __importDefault(require("./routes/formRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api/form", formRoutes_1.default);
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log("Data Source initialized");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
    .catch((err) => console.error("Error initializing data source:", err));
