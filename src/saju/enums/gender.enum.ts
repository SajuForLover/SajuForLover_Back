export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
}

export const GenderDescription: { [key in Gender]: string } = {
    [Gender.MALE]: '남성',
    [Gender.FEMALE]: '여성',
};  