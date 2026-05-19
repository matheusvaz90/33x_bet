/*
  Warnings:

  - You are about to drop the column `finished` on the `Match` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINISHED');

-- CreateEnum
CREATE TYPE "StatusInscricao" AS ENUM ('PENDENTE', 'CONFIRMADA', 'RECUSADA');

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "finished",
ADD COLUMN     "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "observacaoAdmin" TEXT,
ADD COLUMN     "statusInscricao" "StatusInscricao" NOT NULL DEFAULT 'PENDENTE',
ADD COLUMN     "valorInscricao" DOUBLE PRECISION NOT NULL DEFAULT 50;

-- CreateTable
CREATE TABLE "Selecao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "bandeira" TEXT,
    "pesoPalpiteOuro" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Selecao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PalpiteOuro" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "selecaoId" TEXT NOT NULL,
    "pontosObtidos" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PalpiteOuro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CronLog" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "mensagem" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Selecao_nome_key" ON "Selecao"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "PalpiteOuro_userId_key" ON "PalpiteOuro"("userId");

-- AddForeignKey
ALTER TABLE "PalpiteOuro" ADD CONSTRAINT "PalpiteOuro_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalpiteOuro" ADD CONSTRAINT "PalpiteOuro_selecaoId_fkey" FOREIGN KEY ("selecaoId") REFERENCES "Selecao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
