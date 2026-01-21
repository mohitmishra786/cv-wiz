/**
 * Card Component  
 * Container with consistent styling
 */

import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outline' | 'elevated';
}

export default function Card({
    className = '',
    variant = 'default',
    children,
    ...props
}: CardProps) {
    const variants = {
        default: 'bg-white rounded-2xl shadow-sm',
        outline: 'bg-white rounded-2xl border border-gray-200',
        elevated: 'bg-white rounded-2xl shadow-xl',
    };

    return (
        <div className={`${variants[variant]} ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`p-6 border-b border-gray-100 ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardContent({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`p-6 ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`p-6 border-t border-gray-100 ${className}`} {...props}>
            {children}
        </div>
    );
}
